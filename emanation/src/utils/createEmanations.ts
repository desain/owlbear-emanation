import OBR, { Image } from '@owlbear-rodeo/sdk';
import { getPlayerMetadata } from "../metadata/PlayerMetadata";

import { addEntry } from '../metadata/SourceMetadata';
import { createStyle, EmanationStyle } from '../types/EmanationStyle';

export async function createEmanationsWithDefaults(items: Image[]) {
    const playerMetadata = await getPlayerMetadata();
    return createEmanations(
        items,
        playerMetadata.size,
        createStyle(playerMetadata.styleType, playerMetadata.color, playerMetadata.opacity),
    );
}

/**
 * Create emanations for given images.
 * @param items Images to create emanations for.
 * @param size Size of emanations, in grid units.
 * @param effectOverride Effect to use for emanations. Defaults to 'Simple'.
 */
export async function createEmanations(items: Image[], size: number, style: EmanationStyle) {
    if (items.length === 0) {
        return;
    }

    await OBR.scene.items.updateItems(items, (items) => items.forEach((item) => {
        addEntry(item, style, size);
    }));
}