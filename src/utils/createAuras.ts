import OBR from "@owlbear-rodeo/sdk";

import { AuraConfig } from "../types/AuraConfig";
import { CandidateSource } from "../types/CandidateSource";
import { addEntry } from "../types/metadata/SourceMetadata";
import { usePlayerSettings } from "../usePlayerSettings";

export function createAurasWithDefaults(items: CandidateSource[]) {
    const playerSettings = usePlayerSettings.getState();
    return createAuras(items, playerSettings);
}

/**
 * Create auras for given images.
 * @param items Images to create auras for.
 * @param size Size of auras, in grid units.
 * @param effectOverride Effect to use for auras. Defaults to 'Simple'.
 */
export async function createAuras(
    items: CandidateSource[],
    config: AuraConfig,
) {
    if (items.length === 0) {
        return;
    }

    return await OBR.scene.items.updateItems(items, (items) =>
        items.forEach((item) => {
            addEntry(item, config);
        }),
    );
}
