import { Layer } from "@owlbear-rodeo/sdk";
import { isDeepEqual } from "owlbear-utils";
import { AuraStyle, getBlendMode } from "./AuraStyle";

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
