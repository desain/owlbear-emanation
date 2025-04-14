import { BlendMode, Layer } from "@owlbear-rodeo/sdk";

export const BLEND_MODES: BlendMode[] = [
    "SRC_OVER", // Default/normal
    "PLUS", // Commonly used for light effects
    "MULTIPLY", // Good for shadows/darkening
    "SCREEN", // Good for brightening
    "OVERLAY", // Good for contrast
    "SOFT_LIGHT", // Subtle blending
    "HARD_LIGHT", // Strong blending
    "LIGHTEN", // Maximum of both
    "DARKEN", // Minimum of both
    "COLOR_DODGE", // Brightening effect
    "COLOR_BURN", // Darkening effect
    "DIFFERENCE", // Special effects
    "EXCLUSION", // Special effects
    "HUE", // Color adjustments
    "SATURATION", // Color adjustments
    "COLOR", // Color adjustments
    "LUMINOSITY", // Color adjustments
    "MODULATE", // Technical blend modes below
    "XOR",
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
];

export function isBlendMode(mode: string): mode is BlendMode {
    const blendModes2: string[] = BLEND_MODES; // hack to widen type
    return blendModes2.includes(mode);
}

export const LAYERS: Layer[] = [
    "MAP",
    "GRID",
    "DRAWING",
    "PROP",
    "MOUNT",
    "CHARACTER",
    "ATTACHMENT",
    "NOTE",
    "TEXT",
    "RULER",
    "FOG",
    "POINTER",
    "POST_PROCESS",
    "CONTROL",
    "POPOVER",
];

export function isLayer(layer: string): layer is Layer {
    const layers2: string[] = LAYERS; // hack to widen type
    return layers2.includes(layer);
}
