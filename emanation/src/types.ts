import { Curve, GridMeasurement, GridType, isCurve, isShape, Item, Shape, Vector2 } from "@owlbear-rodeo/sdk";

export const PLUGIN_ID = 'com.desain.emanation';
export const METADATA_KEY = `${PLUGIN_ID}/metadata`;

export type Circle = Shape & { shapeType: 'CIRCLE', }
export type Emanation = (Circle | Curve) & {
    metadata: {
        [METADATA_KEY]: EmanationMetadata,
    },
};

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

export type SceneEmanationMetadata = {
    gridMode: boolean,
    gridDpi: number,
    gridMultiplier: number,
    gridMeasurement: GridMeasurement,
    gridType: GridType,
}

export interface PlayerMetadata {
    color: string;
    size: number;
    defaultOpacity: number;
}