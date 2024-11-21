import {
    Curve,
    Effect,
    isCurve,
    isEffect,
    Item,
    Uniform,
} from "@owlbear-rodeo/sdk";
import { Vector3 } from "@owlbear-rodeo/sdk/lib/types/Vector3";
import { METADATA_KEY } from "../constants";
import { Circle, isCircle } from "./Circle";
import { AuraEntry } from "./metadata/SourceMetadata";
import { HasMetadata } from "./metadata/metadataUtils";

export interface IsAttached {
    attachedTo: string;
}

interface AuraMetadata {
    isAura: true;
}

export type SimpleAuraDrawable = Circle | Curve;
export function isDrawable(item: Item): item is SimpleAuraDrawable {
    return isCircle(item) || isCurve(item);
}

export type Aura = (SimpleAuraDrawable | Effect) &
    IsAttached &
    HasMetadata<AuraMetadata>;
export function isAura(item: Item): item is Aura {
    return (
        (isEffect(item) || isCurve(item) || isCircle(item)) &&
        item.attachedTo !== undefined &&
        METADATA_KEY in item.metadata &&
        typeof item.metadata[METADATA_KEY] === "object"
    );
}

export function updateDrawingParams(aura: Aura, auraEntry: AuraEntry) {
    switch (auraEntry.style.type) {
        case "Bubble":
        case "Glow":
        case "Range":
            if (isEffect(aura)) {
                setColorUniform(aura, auraEntry.style.color);
                setOpacityUniform(aura, auraEntry.style.opacity);
            }
            break;
        case "Simple":
            if (isDrawable(aura)) {
                aura.style.fillColor = auraEntry.style.itemStyle.fillColor;
                aura.style.fillOpacity = auraEntry.style.itemStyle.fillOpacity;
                aura.style.strokeColor = auraEntry.style.itemStyle.strokeColor;
                aura.style.strokeDash = auraEntry.style.itemStyle.strokeDash;
                aura.style.strokeOpacity =
                    auraEntry.style.itemStyle.strokeOpacity;
                aura.style.strokeWidth = auraEntry.style.itemStyle.strokeWidth;
            }
            break;
        case "Spirits":
            break; // nothing to set
    }
}

interface ColorUniform extends Uniform {
    name: "color";
    value: Vector3;
}

interface OpacityUniform extends Uniform {
    name: "opacity";
    value: number;
}

function isColorUniform(uniform: Uniform): uniform is ColorUniform {
    return uniform.name === "color";
}

function isOpacityUniform(uniform: Uniform): uniform is OpacityUniform {
    return uniform.name === "opacity";
}

function setColorUniform(aura: Effect, color: Vector3) {
    const colorUniform = aura.uniforms.find(isColorUniform);
    if (colorUniform) {
        colorUniform.value = color;
    }
}

function setOpacityUniform(aura: Effect, opacity: number) {
    const opacityUniform = aura.uniforms.find(isOpacityUniform);
    if (opacityUniform) {
        opacityUniform.value = opacity;
    }
}
