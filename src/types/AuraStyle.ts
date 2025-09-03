import type { BlendMode, CurveStyle, ShapeStyle } from "@owlbear-rodeo/sdk";
import type { HexColor, ImageBuildParams, RgbColor } from "owlbear-utils";
import {
    assumeHexColor,
    hexToRgb,
    isCurveStyle,
    isImageBuildParams,
    isObject,
    isShapeStyle,
    isVector3,
    PINK_RGB,
    rgbToHex,
    WHITE_HEX,
} from "owlbear-utils";

export interface SimpleStyle {
    type: "Simple";
    itemStyle: ShapeStyle | CurveStyle;
}
export function isSimpleStyle(style: unknown): style is SimpleStyle {
    return (
        isObject(style) &&
        "type" in style &&
        style.type === "Simple" &&
        "itemStyle" in style &&
        (isShapeStyle(style.itemStyle) || isCurveStyle(style.itemStyle))
    );
}

export interface ColorOpacityShaderStyle {
    type: "Bubble" | "Glow" | "Range" | "Solid";
    color: RgbColor;
    opacity: number;
}
function isColorOpacityShaderStyleType(
    type: AuraStyleType,
): type is ColorOpacityShaderStyle["type"] {
    switch (type) {
        case "Bubble":
        case "Glow":
        case "Range":
        case "Solid":
            return true;
        case "Custom":
        case "Image":
        case "Simple":
        case "Spirits":
        case "Distort":
            return false;
    }
}
export function isColorOpacityShaderStyle(
    style: unknown,
): style is ColorOpacityShaderStyle {
    return (
        isObject(style) &&
        "type" in style &&
        isAuraStyleType(style.type) &&
        isColorOpacityShaderStyleType(style.type) &&
        "opacity" in style &&
        typeof style.opacity === "number" &&
        "color" in style &&
        isVector3(style.color)
    );
}

interface SpiritsStyle {
    type: "Spirits";
}
function isSpiritsStyle(style: unknown): style is SpiritsStyle {
    return isObject(style) && "type" in style && style.type === "Spirits";
}

interface DistortStyle {
    type: "Distort";
    warpFactor?: number; // Optional for backward compatibility
}
export function isDistortStyle(style: unknown): style is DistortStyle {
    return (
        isObject(style) &&
        "type" in style &&
        style.type === "Distort" &&
        (!("warpFactor" in style) ||
            style.warpFactor === undefined ||
            typeof style.warpFactor === "number")
    );
}

export interface CustomEffectStyle {
    type: "Custom";
    sksl: string;
}
export function isCustomEffectStyle(
    style: unknown,
): style is CustomEffectStyle {
    return (
        isObject(style) &&
        "type" in style &&
        style.type === "Custom" &&
        "sksl" in style &&
        typeof style.sksl === "string"
    );
}

export interface ImageStyle extends ImageBuildParams {
    type: "Image";
}
export function isImageStyle(style: unknown): style is ImageStyle {
    return (
        isImageBuildParams(style) && "type" in style && style.type === "Image"
    );
}

export type EffectStyle = (
    | ColorOpacityShaderStyle
    | SpiritsStyle
    | DistortStyle
    | CustomEffectStyle
) & {
    blendMode?: BlendMode;
};
export function isEffectStyle(style: unknown): style is EffectStyle {
    return (
        (isColorOpacityShaderStyle(style) ||
            isSpiritsStyle(style) ||
            isDistortStyle(style) ||
            isCustomEffectStyle(style)) &&
        (!("blendMode" in style) ||
            style.blendMode === undefined ||
            typeof style.blendMode === "string")
    );
}
export type EffectStyleType = EffectStyle["type"];
export type AuraStyle = SimpleStyle | EffectStyle | ImageStyle;
export function isAuraStyle(style: unknown): style is AuraStyle {
    return isSimpleStyle(style) || isEffectStyle(style) || isImageStyle(style);
}
export type AuraStyleType = AuraStyle["type"];

export const STYLE_TYPES: AuraStyleType[] = [
    "Simple",
    "Image",
    "Bubble",
    "Glow",
    "Range",
    "Spirits",
    "Distort",
    "Solid",
    "Custom",
];
export function isAuraStyleType(style: unknown): style is AuraStyleType {
    const styleTypes: string[] = STYLE_TYPES;
    return typeof style === "string" && styleTypes.includes(style);
}

export function createStyle({
    styleType,
    color,
    opacity,
    blendMode,
    imageBuildParams,
    sksl,
    warpFactor,
}: {
    styleType: AuraStyleType;
    color: HexColor;
    opacity: number;
    blendMode?: BlendMode;
    imageBuildParams?: ImageBuildParams;
    sksl?: string;
    warpFactor?: number;
}): AuraStyle {
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
        case "Solid":
            return {
                type: styleType,
                color: hexToRgb(color) ?? PINK_RGB,
                opacity,
                blendMode,
            };
        case "Spirits":
            return {
                type: styleType,
                blendMode,
            };
        case "Distort":
            return {
                type: styleType,
                blendMode,
                warpFactor,
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
        case "Custom":
            return {
                type: styleType,
                sksl:
                    sksl ??
                    "half4 main(vec2 coord) {\n    return vec4(1.0);\n}",
            };
    }
}

export function getColor(style: AuraStyle): HexColor {
    switch (style.type) {
        case "Bubble":
        case "Glow":
        case "Range":
        case "Solid":
            return rgbToHex(style.color);
        case "Simple":
            return assumeHexColor(style.itemStyle.fillColor);
        case "Spirits":
        case "Image":
        case "Custom":
        case "Distort":
            return WHITE_HEX;
    }
}

export function getBlendMode(style: AuraStyle): BlendMode {
    if ("blendMode" in style && style.blendMode) {
        return style.blendMode;
    }
    return "SRC_OVER";
}

export function setColor(style: AuraStyle, color: HexColor) {
    if ("color" in style) {
        style.color = hexToRgb(color) ?? PINK_RGB;
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
        case "Solid":
            return style.opacity;
        case "Simple":
            return style.itemStyle.fillOpacity;
        case "Spirits":
        case "Image":
        case "Custom":
        case "Distort":
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

export function getWarpFactor(style: DistortStyle): number {
    return style.warpFactor ?? 0.2;
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

export function isPostProcessStyle(styleType: AuraStyleType): boolean {
    switch (styleType) {
        case "Distort":
            return true;
        case "Simple":
        case "Bubble":
        case "Glow":
        case "Range":
        case "Solid":
        case "Spirits":
        case "Custom":
        case "Image":
            return false;
    }
}

export function supportsOverrideShape(styleType: AuraStyleType): boolean {
    switch (styleType) {
        case "Bubble":
        case "Simple":
        case "Solid":
        case "Range":
            return true;
        case "Custom":
        case "Distort":
        case "Glow":
        case "Image":
        case "Spirits":
            return false;
    }
}
