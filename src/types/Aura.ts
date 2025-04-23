import {
    Curve,
    Effect,
    Image,
    isCurve,
    isEffect,
    isImage,
    Item,
    Uniform,
} from "@owlbear-rodeo/sdk";
import { Vector3 } from "@owlbear-rodeo/sdk/lib/types/Vector3";
import { assertItem } from "owlbear-utils";
import { getImageAuraScale } from "../builders/image";
import { METADATA_KEY } from "../constants";
import { usePlayerStorage } from "../state/usePlayerStorage";
import { AuraConfig } from "./AuraConfig";
import { CandidateSource, getAbsoluteItemSize } from "./CandidateSource";
import { Circle, isCircle } from "./Circle";
import { HasMetadata } from "./metadata/metadataUtils";

export interface IsAttached {
    attachedTo: string;
}

export interface AuraMetadata {
    isAura: true;
}

export type SimpleAuraDrawable = Circle | Curve;
export function isDrawable(item: Item): item is SimpleAuraDrawable {
    return isCircle(item) || isCurve(item);
}

export type Aura = (SimpleAuraDrawable | Effect | Image) &
    IsAttached &
    HasMetadata<AuraMetadata>;
export function isAura(item: Item): item is Aura {
    return (
        (isEffect(item) || isCurve(item) || isCircle(item) || isImage(item)) &&
        item.attachedTo !== undefined &&
        METADATA_KEY in item.metadata &&
        typeof item.metadata[METADATA_KEY] === "object"
    );
}

export function updateDrawingParams(
    source: CandidateSource,
    aura: Aura,
    config: AuraConfig,
) {
    if (config.layer) {
        aura.layer = config.layer;
    }
    switch (config.style.type) {
        case "Bubble":
        case "Glow":
        case "Range":
            assertItem(aura, isEffect);
            setColorUniform(aura, config.style.color);
            setOpacityUniform(aura, config.style.opacity);
            break;
        case "Simple":
            assertItem(aura, isDrawable);
            aura.style.fillColor = config.style.itemStyle.fillColor;
            aura.style.fillOpacity = config.style.itemStyle.fillOpacity;
            aura.style.strokeColor = config.style.itemStyle.strokeColor;
            aura.style.strokeDash = config.style.itemStyle.strokeDash;
            aura.style.strokeOpacity = config.style.itemStyle.strokeOpacity;
            aura.style.strokeWidth = config.style.itemStyle.strokeWidth;
            break;
        case "Spirits":
            break; // nothing to set
        case "Image": {
            assertItem(aura, isImage);
            aura.image = config.style.image;
            aura.grid = config.style.grid;
            const grid = usePlayerStorage.getState().grid;
            const absoluteItemSize = getAbsoluteItemSize(source, grid);
            const numUnits = config.size / grid.parsedScale.multiplier;
            aura.scale = getImageAuraScale(
                config.style,
                grid,
                numUnits,
                absoluteItemSize,
            );
            break;
        }
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
