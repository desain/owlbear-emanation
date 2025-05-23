import type { Layer, Vector2 } from "@owlbear-rodeo/sdk";
import type { Units } from "owlbear-utils";
import {
    isDeepEqual,
    isLayer,
    isObject,
    isVector2,
    units,
    WHITE_RGB,
} from "owlbear-utils";
import type { AuraShape } from "./AuraShape";
import { isAuraShape } from "./AuraShape";
import type { AuraStyle } from "./AuraStyle";
import {
    getBlendMode,
    isAuraStyle,
    isEffectStyle,
    isPostProcessStyle,
} from "./AuraStyle";

/**
 * Data that defines how an aura should be displayed.
 */
export interface AuraConfig {
    style: AuraStyle;
    /**
     * Radius in current grid units. Eg if a grid space is 5ft, a value of 5 is an aura of one grid space radius.
     */
    size: Units;
    /**
     * Player IDs that can see this aura. If not set, the aura is visible to all players.
     * If null, the aura is visible to no one.
     */
    visibleTo?: string | null;
    /**
     * Which Owlbear Rodeo layer the aura will be on. If not set, the 'DRAWING' layer
     * will be used. If the style requires the 'POST_PROCESS' layer, the value here
     * will be ignored.
     */
    layer?: Layer;
    /**
     * Optional offset from the source object's position, in grid units.
     * If not set, the aura is centered on the source.
     */
    offset?: Vector2;
    /**
     * Override for this aura's shape. Overrides the value in scene metadata.
     */
    shapeOverride?: AuraShape;
}

export function isAuraConfig(config: unknown): config is AuraConfig {
    return (
        isObject(config) &&
        "style" in config &&
        isAuraStyle(config.style) &&
        "size" in config &&
        typeof config.size === "number" &&
        (!("visibleTo" in config) ||
            config.visibleTo === undefined ||
            typeof config.visibleTo === "string" ||
            config.visibleTo === null) &&
        (!("layer" in config) ||
            config.layer === undefined ||
            (typeof config.layer === "string" && isLayer(config.layer))) &&
        (!("offset" in config) ||
            config.offset === undefined ||
            isVector2(config.offset)) &&
        (!("shapeOverride" in config) ||
            config.shapeOverride === undefined ||
            isAuraShape(config.shapeOverride))
    );
}

export const DEFAULT_AURA_CONFIG: AuraConfig = {
    size: units(5),
    style: {
        type: "Bubble",
        color: WHITE_RGB,
        opacity: 1,
    },
};

/**
 * @returns Layer from the config if it's defined, or 'DRAWING' as default.
 *          If the config style is a style that requires the 'POST_PROCESS'
 *          layer, will return post process instead of what's in the config.
 */
export function getLayer(config: AuraConfig): Layer {
    return isPostProcessStyle(config.style.type)
        ? "POST_PROCESS"
        : config.layer ?? "DRAWING";
}

/**
 * @returns Whether the aura's parameters have changed in a way that can be
 *          updated without rebuilding the aura.
 */
export function drawingParamsChanged(
    oldConfig: AuraConfig,
    newConfig: AuraConfig,
) {
    return (
        !isDeepEqual(oldConfig.style, newConfig.style) ||
        oldConfig.size !== newConfig.size ||
        oldConfig.layer !== newConfig.layer ||
        oldConfig.offset?.x !== newConfig.offset?.x ||
        oldConfig.offset?.y !== newConfig.offset?.y
    );
}

/**
 * @returns Whether the aura's parameters have changed in a way that requires
 *          fully rebuilding the aura.
 */
export function buildParamsChanged(
    oldConfig: AuraConfig,
    newConfig: AuraConfig,
) {
    return (
        // Style type changes always require rebuild
        oldConfig.style.type !== newConfig.style.type ||
        // Shape changes always require rebuild
        oldConfig.shapeOverride !== newConfig.shapeOverride ||
        // Images change size by scaling, so we can resize them without rebuilding the aura.
        // But for everything else, size change means rebuild
        (newConfig.style.type !== "Image" &&
            oldConfig.size !== newConfig.size) ||
        // Effects must include the scene shader in their SKSL iff they're on the post process layer,
        // so moving to or from the post process layer requires rebuild
        (isEffectStyle(newConfig.style) &&
            (oldConfig.layer === "POST_PROCESS") !=
                (newConfig.layer === "POST_PROCESS")) ||
        // Not sure why, but updating the blend mode directly on effect items doesn't work,
        // so we need to rebuild the aura if the blend mode changes.
        getBlendMode(oldConfig.style) !== getBlendMode(newConfig.style)
    );
}
