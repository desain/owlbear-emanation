import type { Vector3 } from "@owlbear-rodeo/sdk/lib/types/Vector3.js";

const HEX_COLOR = Symbol("HexColor");
export type HexColor = string & { readonly [HEX_COLOR]: unique symbol };

const RGB_COLOR = Symbol("RgbColor");
export type RgbColor = Vector3 & { readonly [RGB_COLOR]: unique symbol };

function parseColor(color: string) {
    return /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
}

export function isHexColor(color: string): color is HexColor {
    return parseColor(color) !== null;
}

export function assumeHexColor(color: string): HexColor {
    return color as HexColor;
}

export function hexToRgb(hex: string): RgbColor | null {
    const result = parseColor(hex);
    return result?.[1] && result[2] && result[3]
        ? ({
              x: parseInt(result[1], 16) / 255,
              y: parseInt(result[2], 16) / 255,
              z: parseInt(result[3], 16) / 255,
          } as RgbColor)
        : null;
}

export function rgbToHex({ x, y, z }: RgbColor): HexColor {
    const r = Math.floor(x * 255),
        g = Math.floor(y * 255),
        b = Math.floor(z * 255);
    return assumeHexColor(
        "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1),
    );
}

export const WHITE_HEX: HexColor = assumeHexColor("#FFFFFF");

export const PINK_RGB: RgbColor = { x: 1, y: 0, z: 1 } as RgbColor;
export const WHITE_RGB: RgbColor = { x: 1, y: 1, z: 1 } as RgbColor;
