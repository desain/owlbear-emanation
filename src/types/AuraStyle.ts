import { BlendMode, CurveStyle, Image, ShapeStyle } from "@owlbear-rodeo/sdk";
import { Vector3 } from "@owlbear-rodeo/sdk/lib/types/Vector3";
import { hexToRgb, isHexColor, rgbToHex } from "../utils/colorUtils";

export interface SimpleStyle {
    type: "Simple";
    itemStyle: ShapeStyle | CurveStyle;
}
export function isSimpleStyle(style: AuraStyle): style is SimpleStyle {
    return style.type === "Simple";
}

export interface ColorOpacityShaderStyle {
    type: "Bubble" | "Glow" | "Range";
    color: Vector3;
    opacity: number;
}
export function isColorOpacityShaderStyle(
    style: AuraStyle,
): style is ColorOpacityShaderStyle {
    return (
        (style.type === "Bubble" ||
            style.type === "Glow" ||
            style.type === "Range") &&
        "opacity" in style &&
        typeof style.opacity === "number"
    );
}

export interface SpiritsStyle {
    type: "Spirits";
}
function isSpiritsStyle(style: AuraStyle): style is SpiritsStyle {
    return style.type === "Spirits";
}

/**
 * All the data needed to build an image (excluding the size, which is determined by the aura size).
 */
export type ImageBuildParams = Pick<Image, "image" | "grid">;
export interface ImageStyle extends ImageBuildParams {
    type: "Image";
}
export function isImageStyle(style: AuraStyle): style is ImageStyle {
    return style.type === "Image";
}

export type EffectStyle = (ColorOpacityShaderStyle | SpiritsStyle) & {
    blendMode?: BlendMode;
};
export function isEffectStyle(style: AuraStyle): style is EffectStyle {
    return (
        (isColorOpacityShaderStyle(style) || isSpiritsStyle(style)) &&
        (!("blendMode" in style) || typeof style.blendMode === "string")
    );
}
export type EffectStyleType = EffectStyle["type"];
export type AuraStyle = SimpleStyle | EffectStyle | ImageStyle;
export type AuraStyleType = AuraStyle["type"];

export const STYLE_TYPES: AuraStyleType[] = [
    "Simple",
    "Bubble",
    "Glow",
    "Range",
    "Spirits",
    "Image",
];
export function isAuraStyle(style: string): style is AuraStyleType {
    const styleTypes: string[] = STYLE_TYPES;
    return styleTypes.includes(style);
}

export function createStyle({
    styleType,
    color,
    opacity,
    blendMode,
    imageBuildParams,
}: {
    styleType: AuraStyleType;
    color: string;
    opacity: number;
    blendMode?: BlendMode;
    imageBuildParams?: ImageBuildParams;
}): AuraStyle {
    if (!isHexColor(color)) {
        throw new Error(`Color '${color}' must be a hex color`);
    }

    switch (styleType) {
        case "Simple":
            return {
                type: styleType,
                itemStyle: {
                    fillColor: color,
                    fillOpacity: opacity,
                    strokeColor: color,
                    strokeOpacity: 1,
                    strokeWidth: 10,
                    strokeDash: [],
                },
            };
        case "Bubble":
        case "Glow":
        case "Range":
            return {
                type: styleType,
                color: hexToRgb(color) ?? { x: 1, y: 0, z: 1 },
                opacity,
                blendMode,
            };
        case "Spirits":
            return {
                type: styleType,
                blendMode,
            };
        case "Image":
            imageBuildParams = imageBuildParams ?? {
                image: {
                    url:
                        window.location.origin +
                        import.meta.env.BASE_URL +
                        "missing_image.svg",
                    mime: "image/svg+xml",
                    width: 300,
                    height: 300,
                },
                grid: {
                    dpi: 300,
                    offset: { x: 150, y: 150 },
                },
            };
            return {
                type: styleType,
                ...imageBuildParams,
            };
    }
}

export function getColor(style: AuraStyle): string {
    switch (style.type) {
        case "Bubble":
        case "Glow":
        case "Range":
            return rgbToHex(style.color);
        case "Simple":
            return style.itemStyle.fillColor;
        case "Spirits":
        case "Image":
            return "#FFFFFF";
    }
}

export function getBlendMode(style: AuraStyle): BlendMode {
    if ("blendMode" in style && style.blendMode) {
        return style.blendMode;
    }
    return "SRC_OVER";
}

export function setColor(style: AuraStyle, color: string) {
    if ("color" in style) {
        style.color = hexToRgb(color) ?? { x: 1, y: 0, z: 1 };
    } else if ("itemStyle" in style) {
        style.itemStyle.fillColor = color;
        style.itemStyle.strokeColor = color;
    }
}

export function getOpacity(style: AuraStyle): number {
    switch (style.type) {
        case "Bubble":
        case "Glow":
        case "Range":
            return style.opacity;
        case "Simple":
            return style.itemStyle.fillOpacity;
        case "Spirits":
        case "Image":
            return 1.0;
    }
}

export function setOpacity(style: AuraStyle, opacity: number) {
    if ("opacity" in style) {
        style.opacity = opacity;
    } else if ("itemStyle" in style) {
        style.itemStyle.fillOpacity = opacity;
    }
}

export function getImageBuildParams(
    style: AuraStyle,
): ImageBuildParams | undefined {
    if (isImageStyle(style)) {
        return style;
    }
    return undefined;
}

export function setStyleType(
    style: AuraStyle,
    styleType: AuraStyleType,
): AuraStyle {
    const color = getColor(style);
    const opacity = getOpacity(style);
    const blendMode = getBlendMode(style);
    const imageBuildParams = getImageBuildParams(style);
    return createStyle({
        styleType,
        color,
        opacity,
        blendMode,
        imageBuildParams,
    });
}
