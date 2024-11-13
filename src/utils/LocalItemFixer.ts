import OBR, { Image, Item } from '@owlbear-rodeo/sdk';

import buildAura from '../builders/buildAura';
import { METADATA_KEY } from '../constants';
import { Aura, isAura, updateDrawingParams } from '../types/Aura';
import { AuraStyle } from '../types/AuraStyle';
import { getSceneMetadata, SceneMetadata } from "../types/metadata/SceneMetadata";
import { AuraEntry } from '../types/metadata/SourceMetadata';
import { isSource } from '../types/Source';
import { GridParsed } from '../ui/GridParsed';
import { getId, getSource } from './itemUtils';
import { isDeepEqual } from './jsUtils';

type SourceIdAndScopedId = string;

interface LocalAuraData {
    localItemId: string;
    size: number;
    style: AuraStyle;
}

/**
 * Class to track changes to remote item metadata and mirror it to local items.
 * TODO: Use the Reactor design pattern from official OBR plugins.
 */
export default class LocalItemFixer {
    sourceAndScopedToLocal: Map<SourceIdAndScopedId, LocalAuraData> = new Map();

    static install(): [LocalItemFixer, () => void] {
        const fixer = new LocalItemFixer();
        return [fixer, OBR.scene.local.onChange(items => fixer.forgetDeletedLocals(items))];
    }

    private constructor() { }

    private static key(source: Item, aura: AuraEntry): SourceIdAndScopedId {
        return source.id + '/' + aura.sourceScopedId;
    }

    private forgetDeletedLocals(newLocals: Item[]) {
        const localIds = newLocals.map(getId);
        const toForget = [...this.sourceAndScopedToLocal.entries()].filter(([, { localItemId }]) => !localIds.includes(localItemId));
        for (const [key,] of toForget) {
            this.sourceAndScopedToLocal.delete(key);
        }
    }

    private static add(
        toAdd: [SourceIdAndScopedId, Item, LocalAuraData][],
        source: Image,
        auraEntry: AuraEntry,
        sceneMetadata: SceneMetadata,
        grid: GridParsed,
    ) {
        const aura = buildAura(source, auraEntry.style, auraEntry.size, sceneMetadata, grid);
        const key = LocalItemFixer.key(source, auraEntry);
        const data = { localItemId: aura.id, size: auraEntry.size, style: auraEntry.style }
        toAdd.push([key, aura, data]);
    }

    private remove(toDelete: string[], aura: Aura) {
        // Remove auras that shouldn't exist anymore
        toDelete.push(aura.id);
        const entry = [...this.sourceAndScopedToLocal.entries()]
            .find(([, value]) => value.localItemId === aura.id);
        if (entry) {
            this.sourceAndScopedToLocal.delete(entry[0]);
        }
    }

    private getEntry(source: Image | undefined, aura: Aura): AuraEntry | undefined {
        if (!source || !isSource(source)) {
            return undefined;
        }
        return source.metadata[METADATA_KEY].auras
            .find(entry => {
                const key = LocalItemFixer.key(source, entry);
                const localItemId = this.sourceAndScopedToLocal.get(key)?.localItemId;
                return localItemId === aura.id;
            });
    }

    /**
    * @returns Whether the aura's parameters have changed in a way that requires
    *          fully rebuilding the aura.
    */
    private buildParamsChanged(aura: Aura, entry: AuraEntry) {
        const oldData = [...this.sourceAndScopedToLocal.values()].find(data => data.localItemId === aura.id);
        return oldData?.size !== entry.size
            || oldData.style.type !== entry.style.type;
    }

    /**
     * @returns Whether the aura's parameters have changed in a way that can be
     *          updated without rebuilding the aura.
     */
    private drawingParamsChanged(aura: Aura, entry: AuraEntry) {
        const oldData = [...this.sourceAndScopedToLocal.values()].find(data => data.localItemId === aura.id);
        return !isDeepEqual(oldData?.style, entry.style);
    }

    async fix(grid: GridParsed) {
        const [
            networkItems,
            localItems,
            sceneMetadata,
        ] = await Promise.all([
            OBR.scene.items.getItems(),
            OBR.scene.local.getItems(),
            getSceneMetadata(),
        ]);
        const toAdd: [SourceIdAndScopedId, Aura, LocalAuraData][] = [];
        const toDelete: string[] = [];
        const toUpdate: Aura[] = [];
        const updaters: Map<string, ((aura: Aura) => void)[]> = new Map();
        const scheduleDrawingParamsUpdate = (aura: Aura, entry: AuraEntry) => {
            toUpdate.push(aura);
            if (updaters.get(aura.id) === undefined) {
                updaters.set(aura.id, []);
            }
            updaters.get(aura.id)?.push((item: Item) => {
                if (isAura(item)) {
                    updateDrawingParams(item, entry);
                }
            });
        };

        // Create auras that don't exist yet
        for (const source of networkItems) {
            if (!isSource(source)) {
                continue;
            }
            for (const aura of source.metadata[METADATA_KEY].auras) {
                if (this.sourceAndScopedToLocal.get(LocalItemFixer.key(source, aura)) === undefined) {
                    LocalItemFixer.add(toAdd, source, aura, sceneMetadata, grid);
                }
            }
        }

        for (const aura of localItems) {
            if (!isAura(aura)) {
                continue;
            }
            const source = getSource(aura, networkItems);
            const entry = this.getEntry(source, aura);
            if (!entry) {
                this.remove(toDelete, aura);
            } else if (this.buildParamsChanged(aura, entry)) {
                // Update auras that have changed size or style and need rebuilding
                this.remove(toDelete, aura);
                LocalItemFixer.add(toAdd, source, entry, sceneMetadata, grid);
            } else if (this.drawingParamsChanged(aura, entry)) {
                // Update auras that have changed drawing params but don't need rebuilding
                scheduleDrawingParamsUpdate(aura, entry);
            }
        }

        if (toDelete.length > 0) {
            await OBR.scene.local.deleteItems(toDelete);
        }
        if (toUpdate.length > 0) {
            await OBR.scene.local.updateItems(toUpdate, (items) => items.forEach((item) => {
                const updaterList = updaters.get(item.id);
                if (updaterList) {
                    updaterList.forEach(updater => updater(item));
                }
            }));
        }
        if (toAdd.length > 0) {
            for (const [key, , data] of toAdd) {
                this.sourceAndScopedToLocal.set(key, data);
            }
            await OBR.scene.local.addItems(toAdd.map(([, item]) => item));
        }
    }
}