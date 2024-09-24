import { Curve, isCurve, isShape, Item, Shape, Vector2 } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "./constants";

export type Circle = Shape & { shapeType: 'CIRCLE', }
export type Emanation = (Circle | Curve) & {
    metadata: {
        [METADATA_KEY]: EmanationMetadata,
    },
}

export function isEmanation(item: Item): item is Emanation {
    return typeof item === 'object'
        && item !== null
        && (isCurve(item) || isShape(item))
        && METADATA_KEY in item.metadata
        && typeof item.metadata[METADATA_KEY] === 'object';
}

export type EmanationMetadata = {
    sourceScale: Vector2,
    size: number,
    style: EmanationStyle,
}

export interface EmanationStyle {
    fillColor: string;
    fillOpacity: number;
    strokeColor: string;
    strokeOpacity: number;
    strokeWidth: number;
    strokeDash: number[];
}