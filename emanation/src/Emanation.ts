import { Curve, isCurve, isShape, Item, Shape, Vector2 } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "./constants";

export type Circle = Shape & { shapeType: 'CIRCLE', }
export type Emanation = (Circle | Curve) & {
    metadata: {
        [METADATA_KEY]: EmanationMetadata,
    },
}

export function isEmanation(item: Item): item is Emanation {
    return (isCurve(item) || (isShape(item) && item.shapeType === 'CIRCLE'))
        && METADATA_KEY in item.metadata
        && typeof item.metadata[METADATA_KEY] === 'object';
}

export type EmanationMetadata = {
    /**
     * Scale of the emanation source item. Kept so that when a source changes size, we know to rebuild.
     */
    sourceScale: Vector2,
    size: number,
}