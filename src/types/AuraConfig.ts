import { Layer } from "@owlbear-rodeo/sdk";
import { isDeepEqual, isLayer, isObject } from "owlbear-utils";
import { AuraStyle, getBlendMode, isAuraStyle } from "./AuraStyle";

/**
 * Data that defines how an aura should be displayed.
 */
export interface AuraConfig {
    style: AuraStyle;
    /**
     * Radius in current grid units. Eg if a grid space is 5ft, a value of 5 is an aura of one grid space radius.
     */
    size: number;
    /**
     * Player IDs that can see this aura. If not set, the aura is visible to all players.
     * If null, the aura is visible to no one.
     */
    visibleTo?: string | null;
    /**
     * Which Owlbear Rodeo layer the aura will be on. If not set, the 'DRAWING' layer
     * will be used.
     */
    layer?: Layer;
}
export function isAuraConfig(config: unknown): config is AuraConfig {
    return (
        isObject(config) &&
        "style" in config &&
        isAuraStyle(config.style) &&
        "size" in config &&
        typeof config.size === "number" &&
        (!("visibleTo" in config) ||
            typeof config.visibleTo === "string" ||
            config.visibleTo === null) &&
        (!("layer" in config) ||
            (typeof config.layer === "string" && isLayer(config.layer)))
    );
}

export const DEFAULT_AURA_CONFIG: AuraConfig = {
    size: 5,
    style: {
        type: "Bubble",
        color: { x: 1, y: 1, z: 1 },
        opacity: 1,
    },
};

export function getLayer(config: AuraConfig): Layer {
    return config.layer ?? "DRAWING";
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
        oldConfig.layer !== newConfig.layer
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
    // Images change size by scaling, so we can resize them without rebuilding the aura
    const canChangeSizeWithoutRebuilding =
        oldConfig.style.type === "Image" && newConfig.style.type === "Image";
    return (
        (oldConfig.size !== newConfig.size &&
            !canChangeSizeWithoutRebuilding) ||
        oldConfig.style.type !== newConfig.style.type ||
        // Not sure why, but updating the blend mode directly on effect items doesn't work,
        // so we need to rebuild the aura if the blend mode changes.
        getBlendMode(oldConfig.style) !== getBlendMode(newConfig.style)
    );
}
