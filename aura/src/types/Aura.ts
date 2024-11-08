import { Curve, Effect, isCurve, isEffect, isShape, Item, Shape } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../constants";
import { AuraMetadata } from "../metadata/AuraMetadata";
import { HasMetadata } from '../metadata/metadataUtils';

export interface IsAttached {
    attachedTo: string;
}

export type Circle = Shape & { shapeType: 'CIRCLE', }
export type SimpleAuraDrawable = Circle | Curve;
export type Aura = (SimpleAuraDrawable | Effect)
    & HasMetadata<AuraMetadata>
    & IsAttached;

function isCircle(item: Item): item is Circle {
    return isShape(item) && item.shapeType === 'CIRCLE';
}

export function isDrawable(item: Item): item is SimpleAuraDrawable {
    return isCircle(item) || isCurve(item);
}

export function isAura(item: Item): item is Aura {
    return (isEffect(item) || isCurve(item) || isCircle(item))
        && item.attachedTo !== undefined
        && METADATA_KEY in item.metadata
        && typeof item.metadata[METADATA_KEY] === 'object';
}