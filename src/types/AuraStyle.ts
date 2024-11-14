import { CurveStyle, ShapeStyle } from "@owlbear-rodeo/sdk";
import { Vector3 } from "@owlbear-rodeo/sdk/lib/types/Vector3";
import { hexToRgb, rgbToHex } from "../utils/colorUtils";
import { PlayerMetadata } from "./metadata/PlayerMetadata";

export interface SimpleStyle {
    type: "Simple";
    itemStyle: ShapeStyle | CurveStyle;
}

export interface ColorOpacityShaderStyle {
    type: "Bubble" | "Glow" | "Range";
    color: Vector3;
    opacity: number;
}

export interface SpiritsStyle {
    type: "Spirits";
}

export type EffectStyle = ColorOpacityShaderStyle | SpiritsStyle;
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
    return STYLE_TYPES.includes(style as AuraStyleType);
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

export function getColor(
    style: AuraStyle,
    playerMetadata: PlayerMetadata,
): string {
    switch (style.type) {
        case "Bubble":
        case "Glow":
        case "Range":
            return rgbToHex(style.color);
        case "Simple":
            return style.itemStyle.fillColor;
        case "Spirits":
            return playerMetadata.color;
    }
}

export function setColor(style: AuraStyle, color: string) {
    if ("color" in style) {
        style.color = hexToRgb(color) ?? { x: 1, y: 0, z: 1 };
    } else if ("itemStyle" in style) {
        style.itemStyle.fillColor = color;
        style.itemStyle.strokeColor = color;
    }
}

export function getOpacity(
    style: AuraStyle,
    playerMetadata: PlayerMetadata,
): number {
    switch (style.type) {
        case "Bubble":
        case "Glow":
        case "Range":
            return style.opacity;
        case "Simple":
            return style.itemStyle.fillOpacity;
        case "Spirits":
            return playerMetadata.opacity;
    }
}

export function setOpacity(style: AuraStyle, opacity: number) {
    if ("opacity" in style) {
        style.opacity = opacity;
    } else if ("itemStyle" in style) {
        style.itemStyle.fillOpacity = opacity;
    }
}