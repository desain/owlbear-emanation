import { Curve, Effect, isCurve, isEffect, isShape, Item, Shape } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../constants";
import { EmanationMetadata } from "../metadata/EmanationMetadata";
import { HasMetadata } from '../metadata/metadataUtils';

export interface IsAttached {
    attachedTo: string;
}

export type Circle = Shape & { shapeType: 'CIRCLE', }
export type SimpleEmanationDrawable = Circle | Curve;
export type LocalEmanation = (Circle | Curve | Effect)
    & HasMetadata<EmanationMetadata>
    & IsAttached;
export type Emanation = LocalEmanation;

function isCircle(item: Item): item is Circle {
    return isShape(item) && item.shapeType === 'CIRCLE';
}

export function isDrawable(item: Item): item is SimpleEmanationDrawable {
    return isCircle(item) || isCurve(item);
}

export function isLocalEmanation(item: Item): item is LocalEmanation {
    return (isEffect(item) || isCurve(item) || isCircle(item))
        && item.attachedTo !== undefined
        && METADATA_KEY in item.metadata
        && typeof item.metadata[METADATA_KEY] === 'object';
}

export function isEmanation(item: Item) {
    return isLocalEmanation(item);
}