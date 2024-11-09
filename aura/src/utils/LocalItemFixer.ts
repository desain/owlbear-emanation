import OBR, { Image, Item } from '@owlbear-rodeo/sdk';

import buildAura from '../builders/buildAura';
import { METADATA_KEY } from '../constants';
import { Aura, buildParamsChanged, drawingParamsChanged, isAura, updateDrawingParams } from '../types/Aura';
import { getSceneMetadata, SceneMetadata } from "../types/metadata/SceneMetadata";
import { AuraEntry } from '../types/metadata/SourceMetadata';
import { isSource } from '../types/Source';
import { getId, getSource } from './itemUtils';

type SourceIdAndScopedId = string;
export default class LocalItemFixer {
    sourceAndScopedToLocal: Map<SourceIdAndScopedId, string> = new Map();

    static install(): [LocalItemFixer, () => void] {
        const fixer = new LocalItemFixer();
        return [fixer, OBR.scene.local.onChange(async items => fixer.forgetDeletedLocals(items))];
    }

    private constructor() { }

    private static key(source: Item, aura: AuraEntry): SourceIdAndScopedId {
        return source.id + '/' + aura.sourceScopedId;
    }

    private forgetDeletedLocals(newLocals: Item[]) {
        const localIds = newLocals.map(getId);
        const toForget = this.sourceAndScopedToLocal.entries().filter(([, id]) => !localIds.includes(id));
        for (const [key,] of toForget) {
            this.sourceAndScopedToLocal.delete(key);
        }
    }

    private static add(toAdd: [SourceIdAndScopedId, Item][], source: Image, auraEntry: AuraEntry, sceneMetadata: SceneMetadata) {
        const aura = buildAura(source, auraEntry.style, auraEntry.size, sceneMetadata);
        const key = LocalItemFixer.key(source, auraEntry);
        toAdd.push([key, aura]);
    }

    private remove(toDelete: string[], aura: Aura) {
        // Remove auras that shouldn't exist anymore
        toDelete.push(aura.id);
        const entry = this.sourceAndScopedToLocal.entries()
            .find(([, value]) => value === aura.id);
        if (entry) {
            this.sourceAndScopedToLocal.delete(entry[0]);
        }
    }

    private getEntry(source: Image | undefined, aura: Aura): AuraEntry | undefined {
        if (!source || !isSource(source)) {
            return undefined;
        }
        return source.metadata[METADATA_KEY].auras
            .find(entry => this.sourceAndScopedToLocal.get(LocalItemFixer.key(source, entry)) === aura.id);
    }

    async fix() {
        const [
            networkItems,
            localItems,
            sceneMetadata,
        ] = await Promise.all([
            OBR.scene.items.getItems(),
            OBR.scene.local.getItems(),
            getSceneMetadata(),
        ]);

        const toAdd: [SourceIdAndScopedId, Aura][] = [];
        const toDelete: string[] = [];
        const toUpdate: Aura[] = [];
        const updaters: ((aura: Aura) => void)[] = [];
        const scheduleDrawingParamsUpdate = (aura: Aura, entry: AuraEntry) => {
            toUpdate.push(aura);
            updaters.push((item: Item) => {
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
                    LocalItemFixer.add(toAdd, source, aura, sceneMetadata);
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
            } else if (buildParamsChanged(aura, entry)) {
                // Update auras that have changed size or style and need rebuilding
                this.remove(toDelete, aura);
                LocalItemFixer.add(toAdd, source, entry, sceneMetadata);
            } else if (drawingParamsChanged(aura, entry)) {
                // Update auras that have changed drawing params but don't need rebuilding
                scheduleDrawingParamsUpdate(aura, entry);
            }
        }

        if (toDelete.length > 0) {
            await OBR.scene.local.deleteItems(toDelete);
        }
        if (toUpdate.length > 0) {
            await OBR.scene.local.updateItems(toUpdate, (items) => items.forEach((item, index) => {
                updaters[index](item);
            }));
        }
        if (toAdd.length > 0) {
            for (const [key, item] of toAdd) {
                this.sourceAndScopedToLocal.set(key, item.id);
            }
            await OBR.scene.local.addItems(toAdd.map(([, item]) => item));
        }
    }
}