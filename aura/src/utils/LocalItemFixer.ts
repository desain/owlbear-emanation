import OBR, { Effect, Image, isEffect, Item, Uniform } from '@owlbear-rodeo/sdk';

import { Vector3 } from '@owlbear-rodeo/sdk/lib/types/Vector3';
import buildAura from '../builders/buildAura';
import { METADATA_KEY } from '../constants';
import { getSceneMetadata, SceneMetadata } from "../metadata/SceneMetadata";
import { AuraEntry } from '../metadata/SourceMetadata';
import { Aura, isAura, isDrawable } from '../types/Aura';
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

    private getAura(source: Image | undefined, aura: Aura): AuraEntry | undefined {
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

        const toAdd: [SourceIdAndScopedId, Item][] = [];
        const toDelete: string[] = [];
        const toUpdate: Item[] = [];
        const updaters: ((item: Item) => void)[] = [];
        const scheduleDrawingParamsUpdate = (item: Item, aura: AuraEntry) => {
            toUpdate.push(item);
            updaters.push((item: Item) => {
                if (isAura(item)) {
                    updateDrawingParams(item, aura);
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

        for (const localAura of localItems) {
            if (!isAura(localAura)) {
                continue;
            }
            const source = getSource(localAura, networkItems); // TODO if the whole metadata is removed, this throws. Allow source to be missing
            const aura = this.getAura(source, localAura);
            if (!aura) {
                this.remove(toDelete, localAura);
            } else if (buildParamsChanged(localAura, aura)) {
                // Update auras that have changed size or style and need rebuilding
                this.remove(toDelete, localAura);
                LocalItemFixer.add(toAdd, source, aura, sceneMetadata);
            } else if (drawingParamsChanged(localAura, aura)) {
                // Update auras that have changed drawing params but don't need rebuilding
                scheduleDrawingParamsUpdate(localAura, aura);
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

function buildParamsChanged(localAura: Aura, aura: AuraEntry) {
    return localAura.metadata[METADATA_KEY].size !== aura.size
        || localAura.metadata[METADATA_KEY].style.type !== aura.style.type;
}

const isObject = (object: any) => {
    return object != null && typeof object === "object";
};

const isDeepEqual = (object1: any, object2: any) => {
    const objKeys1 = Object.keys(object1);
    const objKeys2 = Object.keys(object2);

    if (objKeys1.length !== objKeys2.length) return false;

    for (var key of objKeys1) {
        const value1 = object1[key];
        const value2 = object2[key];

        const isObjects = isObject(value1) && isObject(value2);

        if ((isObjects && !isDeepEqual(value1, value2)) ||
            (!isObjects && value1 !== value2)
        ) {
            return false;
        }
    }
    return true;
};

function drawingParamsChanged(localAura: Aura, aura: AuraEntry) {
    return !isDeepEqual(localAura.metadata[METADATA_KEY].style, aura.style);
}

function updateDrawingParams(aura: Aura, auraEntry: AuraEntry) {
    const style = aura.metadata[METADATA_KEY].style;
    switch (auraEntry.style.type) {
        case 'Bubble':
            if (style.type === 'Bubble' && isEffect(aura)) {
                setColorUniform(aura, auraEntry.style.color);
                setOpacityUniform(aura, auraEntry.style.opacity);
            }
            break;
        case 'Simple':
            if (style.type === 'Simple' && isDrawable(aura)) {
                aura.style.fillColor = auraEntry.style.itemStyle.fillColor;
                aura.style.fillOpacity = auraEntry.style.itemStyle.fillOpacity;
                aura.style.strokeColor = auraEntry.style.itemStyle.strokeColor;
                aura.style.strokeDash = auraEntry.style.itemStyle.strokeDash;
                aura.style.strokeOpacity = auraEntry.style.itemStyle.strokeOpacity;
                aura.style.strokeWidth = auraEntry.style.itemStyle.strokeWidth;
            }
            break;
        case 'Spirits':
            break; // nothing to set
        default:
            const _exhaustiveCheck: never = auraEntry.style;
            throw new Error(`Unhandled style type ${_exhaustiveCheck}`);
    }
}

interface ColorUniform extends Uniform {
    name: 'color';
    value: Vector3;
}

interface OpacityUniform extends Uniform {
    name: 'opacity';
    value: number;
}

function isColorUniform(uniform: Uniform): uniform is ColorUniform {
    return uniform.name === 'color';
}

function isOpacityUniform(uniform: Uniform): uniform is OpacityUniform {
    return uniform.name === 'opacity';
}

function setColorUniform(localAura: Effect, color: Vector3) {
    const colorUniform = localAura.uniforms.find(isColorUniform);
    if (colorUniform) {
        colorUniform.value = color;
    }
}

function setOpacityUniform(localAura: Effect, opacity: number) {
    const opacityUniform = localAura.uniforms.find(isOpacityUniform);
    if (opacityUniform) {
        opacityUniform.value = opacity;
    }
}