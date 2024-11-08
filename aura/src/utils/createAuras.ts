import OBR, { Image } from '@owlbear-rodeo/sdk';
import { getPlayerMetadata } from "../metadata/PlayerMetadata";

import { addEntry } from '../metadata/SourceMetadata';
import { AuraStyle, createStyle } from '../types/AuraStyle';

export async function createAurasWithDefaults(items: Image[]) {
    const playerMetadata = await getPlayerMetadata();
    return createAuras(
        items,
        playerMetadata.size,
        createStyle(playerMetadata.styleType, playerMetadata.color, playerMetadata.opacity),
    );
}

/**
 * Create auras for given images.
 * @param items Images to create auras for.
 * @param size Size of auras, in grid units.
 * @param effectOverride Effect to use for auras. Defaults to 'Simple'.
 */
export async function createAuras(items: Image[], size: number, style: AuraStyle) {
    if (items.length === 0) {
        return;
    }

    await OBR.scene.items.updateItems(items, (items) => items.forEach((item) => {
        addEntry(item, style, size);
    }));
}