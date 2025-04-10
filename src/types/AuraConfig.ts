import { isDeepEqual } from "../utils/jsUtils";
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
}

/**
 * @returns Whether the aura's parameters have changed in a way that requires
 *          fully rebuilding the aura.
 */
export function buildParamsChanged(oldEntry: AuraConfig, newEntry: AuraConfig) {
    // Images change size by scaling, so we can resize them without rebuilding the aura
    const canChangeSizeWithoutRebuilding =
        oldEntry.style.type === "Image" && newEntry.style.type === "Image";
    return (
        (oldEntry.size !== newEntry.size && !canChangeSizeWithoutRebuilding) ||
        oldEntry.style.type !== newEntry.style.type ||
        // Not sure why, but updating the blend mode directly on effect items doesn't work,
        // so we need to rebuild the aura if the blend mode changes.
        getBlendMode(oldEntry.style) !== getBlendMode(newEntry.style)
    );
}
/**
 * @returns Whether the aura's parameters have changed in a way that can be
 *          updated without rebuilding the aura.
 */
export function drawingParamsChanged(
    oldEntry: AuraConfig,
    newEntry: AuraConfig,
) {
    return (
        !isDeepEqual(oldEntry.style, newEntry.style) ||
        oldEntry.size !== newEntry.size
    );
}
