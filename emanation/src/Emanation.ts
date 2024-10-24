import OBR, { Curve, Image, isCurve, isShape, Item, Shape, Vector2 } from "@owlbear-rodeo/sdk";
import buildEmanation from "./Builders/buildEmanation";
import { METADATA_KEY } from "./constants";
import { ItemMetadata } from "./metadata/ItemMetadata";
import { getPlayerMetadata } from "./metadata/PlayerMetadata";
import { getSceneMetadata } from "./metadata/SceneMetadata";

export type EmanationMetadata = {
    /**
     * Scale of the emanation source item. Kept so that when a source changes size, we know to rebuild.
     */
    sourceScale: Vector2,
    size: number,
}

export type Circle = Shape & { shapeType: 'CIRCLE', }
export type Emanation = (Circle | Curve) & {
    metadata: {
        [METADATA_KEY]: EmanationMetadata,
    },
    attachedTo: string,
}

export function isEmanation(item: Item): item is Emanation {
    return (isCurve(item) || (isShape(item) && item.shapeType === 'CIRCLE'))
        && item.attachedTo !== undefined
        && METADATA_KEY in item.metadata
        && typeof item.metadata[METADATA_KEY] === 'object';
}

/**
 * Create emanations for given images.
 * @param items Images to create emanations for.
 */
export async function createEmanations(items: Image[]) {
    if (items.length === 0) {
        return;
    }

    const [
        { size, color, opacity },
        sceneMetadata,
    ] = await Promise.all([
        getPlayerMetadata(),
        getSceneMetadata(),
    ]);

    const toAdd = items.map((item) => buildEmanation(
        item,
        {
            fillColor: color,
            fillOpacity: opacity,
            strokeColor: color,
            strokeOpacity: 1,
            strokeWidth: 10,
            strokeDash: [],
        },
        size,
        sceneMetadata,
    ));

    await OBR.scene.items.updateItems(items, (items) => items.forEach((item) => {
        const newMetadata: ItemMetadata = { hasEmanations: true };
        item.metadata[METADATA_KEY] = newMetadata;
    }));
    await OBR.scene.items.addItems(toAdd);
}