import OBR, { Effect, Image, isEffect, Item, Uniform } from '@owlbear-rodeo/sdk';

import { Vector3 } from '@owlbear-rodeo/sdk/lib/types/Vector3';
import buildEmanation from '../builders/buildEmanation';
import { METADATA_KEY } from '../constants';
import { getSceneMetadata, SceneMetadata } from "../metadata/SceneMetadata";
import { EmanationEntry } from '../metadata/SourceMetadata';
import { isDrawable, isLocalEmanation, LocalEmanation } from '../types/Emanation';
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

    private static key(source: Item, aura: EmanationEntry): SourceIdAndScopedId {
        return source.id + '/' + aura.sourceScopedId;
    }

    private forgetDeletedLocals(newLocals: Item[]) {
        const localIds = newLocals.map(getId);
        const toForget = this.sourceAndScopedToLocal.entries().filter(([, id]) => !localIds.includes(id));
        for (const [key,] of toForget) {
            this.sourceAndScopedToLocal.delete(key);
        }
    }

    private static add(toAdd: [SourceIdAndScopedId, Item][], source: Image, aura: EmanationEntry, sceneMetadata: SceneMetadata) {
        const emanation = buildEmanation(source, aura.style, aura.size, sceneMetadata);
        const key = LocalItemFixer.key(source, aura);
        toAdd.push([key, emanation]);
    }

    private remove(toDelete: string[], emanation: LocalEmanation) {
        // Remove emanations that shouldn't exist anymore
        toDelete.push(emanation.id);
        const entry = this.sourceAndScopedToLocal.entries()
            .find(([, value]) => value === emanation.id);
        if (entry) {
            this.sourceAndScopedToLocal.delete(entry[0]);
        }
    }

    private getAura(source: Image | undefined, emanation: LocalEmanation): EmanationEntry | undefined {
        if (!source || !isSource(source)) {
            return undefined;
        }
        return source.metadata[METADATA_KEY].auras
            .find(aura => this.sourceAndScopedToLocal.get(LocalItemFixer.key(source, aura)) === emanation.id);
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
        const scheduleDrawingParamsUpdate = (item: Item, aura: EmanationEntry) => {
            toUpdate.push(item);
            updaters.push((item: Item) => {
                if (isLocalEmanation(item)) {
                    updateDrawingParams(item, aura);
                }
            });
        };

        // Create emanations that don't exist yet
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

        for (const localEmanation of localItems) {
            if (!isLocalEmanation(localEmanation)) {
                continue;
            }
            const source = getSource(localEmanation, networkItems); // TODO if the whole metadata is removed, this throws. Allow source to be missing
            const aura = this.getAura(source, localEmanation);
            if (!aura) {
                this.remove(toDelete, localEmanation);
            } else if (buildParamsChanged(localEmanation, aura)) {
                // Update emanations that have changed size or style and need rebuilding
                this.remove(toDelete, localEmanation);
                LocalItemFixer.add(toAdd, source, aura, sceneMetadata);
            } else if (drawingParamsChanged(localEmanation, aura)) {
                // Update emanations that have changed drawing params but don't need rebuilding
                scheduleDrawingParamsUpdate(localEmanation, aura);
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

function buildParamsChanged(localEmanation: LocalEmanation, aura: EmanationEntry) {
    return localEmanation.metadata[METADATA_KEY].size !== aura.size
        || localEmanation.metadata[METADATA_KEY].style.type !== aura.style.type;
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

function drawingParamsChanged(localEmanation: LocalEmanation, aura: EmanationEntry) {
    return !isDeepEqual(localEmanation.metadata[METADATA_KEY].style, aura.style);
}

function updateDrawingParams(emanation: LocalEmanation, aura: EmanationEntry) {
    const style = emanation.metadata[METADATA_KEY].style;
    switch (aura.style.type) {
        case 'Fade':
            if (style.type === 'Fade' && isEffect(emanation)) {
                setColorUniform(emanation, aura.style.color);
                setOpacityUniform(emanation, aura.style.opacity);
            }
            break;
        case 'Simple':
            if (style.type === 'Simple' && isDrawable(emanation)) {
                emanation.style.fillColor = aura.style.itemStyle.fillColor;
                emanation.style.fillOpacity = aura.style.itemStyle.fillOpacity;
                emanation.style.strokeColor = aura.style.itemStyle.strokeColor;
                emanation.style.strokeDash = aura.style.itemStyle.strokeDash;
                emanation.style.strokeOpacity = aura.style.itemStyle.strokeOpacity;
                emanation.style.strokeWidth = aura.style.itemStyle.strokeWidth;
            }
            break;
        case 'Spirits':
            break; // nothing to set
        default:
            const _exhaustiveCheck: never = aura.style;
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

function setColorUniform(localEmanation: Effect, color: Vector3) {
    const colorUniform = localEmanation.uniforms.find(isColorUniform);
    if (colorUniform) {
        colorUniform.value = color;
    }
}

function setOpacityUniform(localEmanation: Effect, opacity: number) {
    const opacityUniform = localEmanation.uniforms.find(isOpacityUniform);
    if (opacityUniform) {
        opacityUniform.value = opacity;
    }
}