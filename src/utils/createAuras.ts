import OBR from "@owlbear-rodeo/sdk";

import { usePlayerStorage } from "../state/usePlayerStorage";
import type { AuraConfig} from "../types/AuraConfig";
import { DEFAULT_AURA_CONFIG } from "../types/AuraConfig";
import type { CandidateSource } from "../types/CandidateSource";
import { addEntry } from "../types/metadata/SourceMetadata";

export function createAurasWithDefaults(items: CandidateSource[]) {
    const playerSettings = usePlayerStorage.getState();
    const config =
        playerSettings.presets.length === 0
            ? DEFAULT_AURA_CONFIG
            : playerSettings.presets[0].config;
    return createAuras(items, config);
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
