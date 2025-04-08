import { BlendMode } from "@owlbear-rodeo/sdk";

export const BLEND_MODES: BlendMode[] = [
    "SRC_OVER",
    "CLEAR",
    "SRC",
    "DST",
    "DST_OVER",
    "SRC_IN",
    "DST_IN",
    "SRC_OUT",
    "DST_OUT",
    "SRC_ATOP",
    "DST_ATOP",
    "XOR",
    "PLUS",
    "MODULATE",
    "SCREEN",
    "OVERLAY",
    "DARKEN",
    "LIGHTEN",
    "COLOR_DODGE",
    "COLOR_BURN",
    "HARD_LIGHT",
    "SOFT_LIGHT",
    "DIFFERENCE",
    "EXCLUSION",
    "MULTIPLY",
    "HUE",
    "SATURATION",
    "COLOR",
    "LUMINOSITY",
];

export function isBlendMode(mode: string): mode is BlendMode {
    return (BLEND_MODES as string[]).includes(mode);
}
