import type { Curve, Effect, Image, Item, Uniform } from "@owlbear-rodeo/sdk";
import { isCurve, isEffect, isImage } from "@owlbear-rodeo/sdk";
import { assertItem, unitsToCells } from "owlbear-utils";
import { getImageAuraScale } from "../builders/image";
import { METADATA_KEY } from "../constants";
import { usePlayerStorage } from "../state/usePlayerStorage";
import type { RgbColor } from "../utils/colorUtils";
import type { AuraConfig } from "./AuraConfig";
import { getWarpFactor, isPostProcessStyle } from "./AuraStyle";
import type { CandidateSource } from "./CandidateSource";
import { getSourceSizePx } from "./CandidateSource";
import type { Circle } from "./Circle";
import { isCircle } from "./Circle";
import type { HasMetadata } from "./metadata/metadataUtils";

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
    if (config.layer && !isPostProcessStyle(config.style.type)) {
        aura.layer = config.layer;
    }
    switch (config.style.type) {
        case "Bubble":
        case "Glow":
        case "Range":
        case "Solid":
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
        case "Distort":
            assertItem(aura, isEffect);
            setNumberUniform(aura, "warpFactor", getWarpFactor(config.style));
            break;
        case "Image": {
            assertItem(aura, isImage);
            aura.image = config.style.image;
            aura.grid = config.style.grid;
            const grid = usePlayerStorage.getState().grid;
            const absoluteItemSize = getSourceSizePx(source, grid);
            const radius = unitsToCells(config.size, grid);
            aura.scale = getImageAuraScale(
                config.style,
                grid,
                radius,
                absoluteItemSize,
            );
            break;
        }
        case "Custom":
            assertItem(aura, isEffect);
            aura.sksl = config.style.sksl;
            break;
    }
}

interface ColorUniform extends Uniform {
    name: "color";
    value: RgbColor;
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

function setColorUniform(aura: Effect, color: RgbColor) {
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

function setNumberUniform(
    aura: Effect,
    uniformName: string,
    uniformValue: number,
) {
    const uniform = aura.uniforms.find(
        (uniform) => uniform.name === uniformName,
    );
    if (uniform) {
        uniform.value = uniformValue;
    }
}
