import OBR, { Item } from "@owlbear-rodeo/sdk";

import AwaitLock from "await-lock";
import buildAura from "../builders/buildAura";
import { METADATA_KEY } from "../constants";
import { Aura, isAura, updateDrawingParams } from "../types/Aura";
import { GridParsed, watchGrid } from "../types/GridParsed";
import {
    SceneMetadata,
    watchSceneMetadata,
} from "../types/metadata/SceneMetadata";
import {
    AuraEntry,
    buildParamsChanged,
    drawingParamsChanged,
} from "../types/metadata/SourceMetadata";
import { getEntry, isSource, Source } from "../types/Source";
import { assertItem, didChangeScale, hasId } from "./itemUtils";
import { deferCallAll, getOrInsert } from "./jsUtils";
import { watcherToLatest } from "./watchers";

type SourceAndAuras = {
    source: Source;
    /**
     * Map of scoped ID to local aura item ID.
     */
    auras: Map<string, string>;
};

function createLock() {
    const lock = new AwaitLock();
    return async (runnable: () => Promise<void>) => {
        await lock.acquireAsync();
        try {
            await runnable();
        } finally {
            lock.release();
        }
    };
}

/**
 * Class to track changes to remote item metadata and mirror it to local items.
 * TODO: Use the Reconciler/Reactor/Actor/Patcher design pattern from official OBR plugins.
 */
export default class AuraFixer {
    private sources: Map<string, SourceAndAuras> = new Map();

    static async install(): Promise<[AuraFixer, VoidFunction]> {
        const fixer = new AuraFixer();
        const withLock = createLock();

        const [
            [getGrid, addGridWatcher, unsubscribeGrid],
            [
                getSceneMetadata,
                addSceneMetadataWatcher,
                unsubscribeSceneMetadata,
            ],
        ] = await Promise.all([
            watcherToLatest(watchGrid),
            watcherToLatest(watchSceneMetadata),
        ]);

        addGridWatcher(async (grid) => {
            return await withLock(async () => {
                const items = await OBR.scene.items.getItems();
                return await fixer.fix(grid, items, getSceneMetadata(), true);
            });
        });
        addSceneMetadataWatcher(async (sceneMetadata) => {
            return await withLock(async () => {
                const items = await OBR.scene.items.getItems();
                return await fixer.fix(getGrid(), items, sceneMetadata, true);
            });
        });
        const unsubscribeItems = OBR.scene.items.onChange(async (items) => {
            return await withLock(async () => {
                return await fixer.fix(getGrid(), items, getSceneMetadata());
            });
        });
        return [
            fixer,
            deferCallAll(
                unsubscribeGrid,
                unsubscribeSceneMetadata,
                unsubscribeItems,
            ),
        ];
    }

    private constructor() {}

    private getNewAuras(source: Source): AuraEntry[] {
        const oldEntry = this.sources.get(source.id);
        if (oldEntry === undefined) {
            return source.metadata[METADATA_KEY].auras;
        }
        return source.metadata[METADATA_KEY].auras.filter(
            (aura) => !oldEntry.auras.has(aura.sourceScopedId),
        );
    }

    async fix(
        grid: GridParsed,
        networkItems: Item[],
        sceneMetadata: SceneMetadata,
        rebuildAll: boolean = false,
    ) {
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
                sceneMetadata,
                grid,
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
                if (newEntry === undefined) {
                    // aura was deleted
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
                            updateDrawingParams(aura, newEntry);
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
        await OBR.scene.local.deleteItems(
            Array.from(this.sources.values()).flatMap((sourceAndAuras) =>
                Array.from(sourceAndAuras.auras.values()),
            ),
        );
        this.sources = new Map();
    }
}

// const key = LocalItemFixer.key(sourceId, oldEntry);

// // Remove auras if they have no source or the source has deleted their entry
// const source = networkItems.find(hasId(sourceId));
// const newEntry = getEntry(source, oldEntry.sourceScopedId);
// if (
//     source === undefined ||
//     !isSource(source) ||
//     newEntry === undefined
// ) {
//     toDelete.push(localItemId);
//     this.sources.delete(key);
// } else if (buildParamsChanged(oldEntry, newEntry)) {
//     toDelete.push(localItemId);
//     this.sources.delete(key);
//     this.add(toAdd, source, newEntry, sceneMetadata, grid);
// } else if (drawingParamsChanged(oldEntry, newEntry)) {
//     toUpdate.push(localItemId);
//     this.sources.set(key, {
//         sourceId,
//         localItemId,
//         entry: newEntry,
//     });
//     const updater = (item: Item) => {
//         if (isAura(item)) {
//             updateDrawingParams(item, newEntry);
//         }
//     };
//     const updaterList = updaters.get(localItemId);
//     if (updaterList !== undefined) {
//         updaterList.push(updater);
//     } else {
//         updaters.set(localItemId, [updater]);
//     }
// }

// for (const aura of localItems) {
//     if (!isAura(aura)) {
//         continue;
//     }
//     const source = getSource(aura, networkItems);
//     const entry = this.getEntry(source, aura);
//     if (!entry) {
//         // Remove auras that shouldn't exist anymore
//         this.remove(toDelete, aura);
//     } else if (this.buildParamsChanged(aura, entry)) {
//         // Update auras that have changed size or style and need rebuilding
//         this.remove(toDelete, aura);
//         LocalItemFixer.add(toAdd, source, entry, sceneMetadata, grid);
//     } else if (this.drawingParamsChanged(aura, entry)) {
//         // Update auras that have changed drawing params but don't need rebuilding
//         toUpdate.push(aura);
//         if (updaters.get(aura.id) === undefined) {
//             updaters.set(aura.id, []);
//         }
//         updaters.get(aura.id)?.push((item: Item) => {
//             if (isAura(item)) {
//                 updateDrawingParams(item, entry);
//             }
//         });
//     }
// }
