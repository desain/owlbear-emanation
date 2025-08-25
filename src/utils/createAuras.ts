import OBR from "@owlbear-rodeo/sdk";

import { usePlayerStorage } from "../state/usePlayerStorage";
import type { AuraConfig } from "../types/AuraConfig";
import { DEFAULT_AURA_CONFIG } from "../types/AuraConfig";
import type { CandidateSource } from "../types/CandidateSource";
import { addEntry } from "../types/metadata/SourceMetadata";

export function createAurasWithDefaults(items: CandidateSource[]) {
    const playerSettings = usePlayerStorage.getState();
    const config = playerSettings.presets[0]?.config;
    return createAuras(items, [config ?? DEFAULT_AURA_CONFIG]);
}

/**
 * Create auras for given images.
 * @param items Images to create auras for.
 * @param configs Aura configs to add for each item.
 */
export async function createAuras(
    items: CandidateSource[],
    configs: AuraConfig[],
) {
    if (items.length === 0 || configs.length === 0) {
        return;
    }

    return await OBR.scene.items.updateItems(items, (items) =>
        items.forEach((item) => {
            for (const config of configs) {
                addEntry(item, config);
            }
        }),
    );
}
