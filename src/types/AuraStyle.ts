import { BlendMode, CurveStyle, ShapeStyle } from "@owlbear-rodeo/sdk";
import { Vector3 } from "@owlbear-rodeo/sdk/lib/types/Vector3";
import { usePlayerSettings } from "../usePlayerSettings";
import { hexToRgb, rgbToHex } from "../utils/colorUtils";

export interface SimpleStyle {
    type: "Simple";
    itemStyle: ShapeStyle | CurveStyle;
}

export interface ColorOpacityShaderStyle {
    type: "Bubble" | "Glow" | "Range";
    color: Vector3;
    opacity: number;
}
function isColorOpacityShaderStyle(
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
export type AuraStyle = SimpleStyle | EffectStyle;
export type AuraStyleType = AuraStyle["type"];

export const STYLE_TYPES: AuraStyleType[] = [
    "Simple",
    "Bubble",
    "Glow",
    "Range",
    "Spirits",
];
export function isAuraStyle(style: string): style is AuraStyleType {
    const styleTypes: string[] = STYLE_TYPES;
    return styleTypes.includes(style);
}

export function createStyle(
    styleType: AuraStyleType,
    color: string,
    opacity: number,
): AuraStyle {
    return styleType === "Simple"
        ? {
              type: styleType,
              itemStyle: {
                  fillColor: color,
                  fillOpacity: opacity,
                  strokeColor: color,
                  strokeOpacity: 1,
                  strokeWidth: 10,
                  strokeDash: [],
              },
          }
        : styleType === "Bubble" ||
          styleType === "Glow" ||
          styleType === "Range"
        ? {
              type: styleType,
              color: hexToRgb(color) ?? { x: 1, y: 0, z: 1 },
              opacity: opacity,
          }
        : {
              type: styleType,
          };
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
            return usePlayerSettings.getState().color;
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
            return usePlayerSettings.getState().opacity;
    }
}

export function setOpacity(style: AuraStyle, opacity: number) {
    if ("opacity" in style) {
        style.opacity = opacity;
    } else if ("itemStyle" in style) {
        style.itemStyle.fillOpacity = opacity;
    }
}
