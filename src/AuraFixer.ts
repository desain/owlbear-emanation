import OBR, { Item } from "@owlbear-rodeo/sdk";

import AwaitLock from "await-lock";
import buildAura from "./builders/buildAura";
import { METADATA_KEY } from "./constants";
import { Aura, isAura, updateDrawingParams } from "./types/Aura";
import {
    AuraConfig,
    buildParamsChanged,
    drawingParamsChanged,
} from "./types/AuraConfig";
import { AuraEntry } from "./types/metadata/SourceMetadata";
import { getEntry, isSource, Source } from "./types/Source";
import { useOwlbearStore } from "./useOwlbearStore";
import { assertItem, didChangeScale, hasId } from "./utils/itemUtils";
import { deferCallAll, getOrInsert } from "./utils/jsUtils";

type SourceAndAuras = {
    source: Source;
    /**
     * Map of scoped ID to local aura item ID.
     */
    auras: Map<string, string>;
};

type AsyncConsumer<T> = (t: T) => Promise<void>;
type Sources = Map<string, SourceAndAuras>;

function createLock() {
    const lock = new AwaitLock();

    async function withLock<T>(consumer: AsyncConsumer<T>, t: T) {
        await lock.acquireAsync();
        try {
            await consumer(t);
        } finally {
            lock.release();
        }
    }

    function lockify<T>(asyncRunnable: AsyncConsumer<T>): AsyncConsumer<T> {
        return (t) => withLock(asyncRunnable, t);
    }

    return lockify;
}

/**
 * Class to track changes to remote item metadata and mirror it to local items.
 * TODO: Use the Reconciler/Reactor/Actor/Patcher design pattern from official OBR plugins?
 */
export default class AuraFixer {
    private sources: Sources = new Map();
    private currentPlayerId: string;

    /**
     * Create fixer. Uses useOwlbearStore, so only works if store is syncing.
     * @returns [fixer, function to uninstall fixer]
     */
    static async install(): Promise<[AuraFixer, VoidFunction]> {
        const [playerId, currentLatestItems] = await Promise.all([
            OBR.player.getId(),
            OBR.scene.items.getItems(),
        ]);
        const fixer = new AuraFixer(playerId);
        const lockify = createLock();

        let latestItems = currentLatestItems;
        const unsubscribeItems = OBR.scene.items.onChange(
            lockify(async (items) => {
                latestItems = items;
                await fixer.fix(items);
            }),
        );

        const unsubscribeGrid = useOwlbearStore.subscribe(
            (store) => store.grid,
            lockify(async () => fixer.fix(latestItems, true)),
        );

        const unsubscribeSceneMetadata = useOwlbearStore.subscribe(
            (store) => store.sceneMetadata,
            lockify(async () => fixer.fix(latestItems, true)),
        );

        await fixer.fix(latestItems);

        return [
            fixer,
            deferCallAll(
                unsubscribeItems,
                unsubscribeGrid,
                unsubscribeSceneMetadata,
                () => fixer.destroy(),
            ),
        ];
    }

    private constructor(currentPlayerId: string) {
        this.currentPlayerId = currentPlayerId;
    }

    private isAuraVisibleToCurrentPlayer(entry: AuraConfig): boolean {
        return (
            entry.visibleTo === undefined ||
            entry.visibleTo === this.currentPlayerId
        );
    }

    private getNewAuras(source: Source): AuraEntry[] {
        const oldEntry = this.sources.get(source.id);
        if (oldEntry === undefined) {
            return source.metadata[METADATA_KEY].auras.filter((entry) =>
                this.isAuraVisibleToCurrentPlayer(entry),
            );
        }
        return source.metadata[METADATA_KEY].auras.filter(
            (aura) =>
                !oldEntry.auras.has(aura.sourceScopedId) &&
                this.isAuraVisibleToCurrentPlayer(aura),
        );
    }

    async fix(networkItems: Item[], rebuildAll: boolean = false) {
        const store = useOwlbearStore.getState();
        const toAdd: Aura[] = [];
        const toDelete: string[] = [];
        const toUpdate: string[] = [];
        const updaters: Map<string, ((aura: Aura) => void)[]> = new Map();

        const newSources: typeof this.sources = new Map();
        const saveAuraId = (
            source: Source,
            entry: AuraEntry,
            auraId: string,
        ) => {
            const sourceAndAuras = getOrInsert(newSources, source.id, () => ({
                source,
                auras: new Map(),
            }));
            sourceAndAuras.auras.set(entry.sourceScopedId, auraId);
        };
        const createAura = (source: Source, entry: AuraEntry) => {
            const aura = buildAura(
                source,
                entry.style,
                entry.size,
                store.sceneMetadata,
                store.grid,
            );
            toAdd.push(aura);
            saveAuraId(source, entry, aura.id);
        };

        // Create auras that don't exist yet
        for (const source of networkItems) {
            if (isSource(source)) {
                for (const newAuraEntry of this.getNewAuras(source)) {
                    createAura(source, newAuraEntry);
                }
            }
        }

        // Update and delete auras we're tracking
        for (const {
            source: oldSource,
            auras: oldAuras,
        } of this.sources.values()) {
            // check for deleted sources
            // TODO: hashmap lookup rather than linear search
            const newSource = networkItems.find(hasId(oldSource.id));
            if (newSource === undefined || !isSource(newSource)) {
                // source was deleted or all auras were removed
                // if it was deleted, its auras will already be gone
                // but if not, we need to delete them
                toDelete.push(...oldAuras.values());
                continue;
            }

            // skip items that haven't been modified if we're not just rebuilding everything
            if (
                !rebuildAll &&
                oldSource.lastModified === newSource.lastModified
            ) {
                newSources.set(oldSource.id, {
                    source: newSource,
                    auras: oldAuras,
                });
                continue;
            }

            // check for deleted or updated auras
            for (const [scopedId, localItemId] of oldAuras) {
                const oldEntry = getEntry(oldSource, scopedId)!; // never null if this is kept in sync
                const newEntry = getEntry(newSource, scopedId);
                if (
                    newEntry === undefined ||
                    !this.isAuraVisibleToCurrentPlayer(newEntry)
                ) {
                    // aura was deleted or made invisible
                    toDelete.push(localItemId);
                } else if (
                    rebuildAll ||
                    didChangeScale(oldSource, newSource) ||
                    buildParamsChanged(oldEntry, newEntry)
                ) {
                    // aura needs to be rebuilt
                    toDelete.push(localItemId);
                    createAura(newSource, newEntry);
                } else if (drawingParamsChanged(oldEntry, newEntry)) {
                    toUpdate.push(localItemId);
                    getOrInsert(updaters, localItemId, () => []).push(
                        (aura) => {
                            updateDrawingParams(newSource, aura, newEntry);
                        },
                    );
                    saveAuraId(newSource, newEntry, localItemId); // keep this aura for next state
                } else {
                    saveAuraId(newSource, newEntry, localItemId); // keep this aura for next state
                }
            }
        }

        this.sources = newSources;

        if (toDelete.length > 0) {
            await OBR.scene.local.deleteItems(toDelete);
        }
        if (toAdd.length > 0) {
            await OBR.scene.local.addItems(toAdd);
        }
        if (toUpdate.length > 0) {
            await OBR.scene.local.updateItems(toUpdate, (items) =>
                items.forEach((item) => {
                    assertItem(item, isAura);
                    const updaterList = updaters.get(item.id);
                    if (updaterList) {
                        updaterList.forEach((updater) => updater(item));
                    }
                }),
            );
        }
    }

    async destroy() {
        console.log("Destroying local items");
        if (await OBR.scene.isReady()) {
            await OBR.scene.local.deleteItems(
                Array.from(this.sources.values()).flatMap((sourceAndAuras) =>
                    Array.from(sourceAndAuras.auras.values()),
                ),
            );
        }
        this.sources = new Map();
    }
}
