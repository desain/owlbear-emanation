import OBR, { Image } from "@owlbear-rodeo/sdk";

import { AuraStyle, createStyle } from "../types/AuraStyle";
import { addEntry } from "../types/metadata/SourceMetadata";
import { usePlayerSettings } from "../usePlayerSettings";

export function createAurasWithDefaults(items: Image[]) {
    const playerSettings = usePlayerSettings.getState();
    return createAuras(
        items,
        playerSettings.size,
        createStyle(
            playerSettings.styleType,
            playerSettings.color,
            playerSettings.opacity,
        ),
    );
}

/**
 * Create auras for given images.
 * @param items Images to create auras for.
 * @param size Size of auras, in grid units.
 * @param effectOverride Effect to use for auras. Defaults to 'Simple'.
 */
export async function createAuras(
    items: Image[],
    size: number,
    style: AuraStyle,
) {
    if (items.length === 0) {
        return;
    }

    return await OBR.scene.items.updateItems(items, (items) =>
        items.forEach((item) => {
            addEntry(item, style, size);
        }),
    );
}
