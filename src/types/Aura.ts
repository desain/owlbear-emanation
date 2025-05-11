import type {
    Curve,
    Effect,
    Image,
    Item,
    Uniform,
    Vector2,
} from "@owlbear-rodeo/sdk";
import { isCurve, isEffect, isImage } from "@owlbear-rodeo/sdk";
import type { HasParameterizedMetadata, RgbColor } from "owlbear-utils";
import { assertItem, ORIGIN, unitsToCells } from "owlbear-utils";
import { getAuraPosition } from "../builders/buildAura";
import { getImageAuraScale } from "../builders/image";
import { METADATA_KEY_IS_AURA, METADATA_KEY_SCOPED_ID } from "../constants";
import { usePlayerStorage } from "../state/usePlayerStorage";
import type { IsAttached } from "../utils/itemUtils";
import type { AuraConfig } from "./AuraConfig";
import { getWarpFactor, isPostProcessStyle } from "./AuraStyle";
import type { CandidateSource } from "./CandidateSource";
import { getSourceSizePx } from "./CandidateSource";
import type { Circle } from "./Circle";
import { isCircle } from "./Circle";

export type SimpleAuraDrawable = Circle | Curve;
export function isDrawable(item: Item): item is SimpleAuraDrawable {
    return isCircle(item) || isCurve(item);
}

export type Aura = (SimpleAuraDrawable | Effect | Image) &
    IsAttached &
    HasParameterizedMetadata<typeof METADATA_KEY_IS_AURA, true> &
    HasParameterizedMetadata<typeof METADATA_KEY_SCOPED_ID, string>;
export function isAura(item: Item): item is Aura {
    return (
        (isEffect(item) || isCurve(item) || isCircle(item) || isImage(item)) &&
        item.attachedTo !== undefined &&
        METADATA_KEY_IS_AURA in item.metadata &&
        item.metadata[METADATA_KEY_IS_AURA] === true &&
        METADATA_KEY_SCOPED_ID in item.metadata &&
        typeof item.metadata[METADATA_KEY_SCOPED_ID] === "string"
    );
}

export function getAuraSquareOffset(aura: Aura): Vector2 {
    if (isEffect(aura)) {
        return { x: -aura.width / 2, y: -aura.height / 2 };
    }
    return ORIGIN;
}

export function updateDrawingParams(
    source: CandidateSource,
    aura: Aura,
    config: AuraConfig,
) {
    if (config.layer && !isPostProcessStyle(config.style.type)) {
        aura.layer = config.layer;
    }
    aura.position = getAuraPosition(
        source.position,
        config.offset,
        getAuraSquareOffset(aura),
    );
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

export function getAuraCenter(aura: Aura): Vector2 {
    if (isEffect(aura)) {
        return {
            x: aura.position.x + aura.width / 2,
            y: aura.position.y + aura.height / 2,
        };
    }
    return aura.position;
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
