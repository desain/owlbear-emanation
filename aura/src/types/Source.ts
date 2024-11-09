import OBR, { Image, isImage, Item, Math2 } from "@owlbear-rodeo/sdk";

import { METADATA_KEY, VECTOR2_COMPARE_EPSILON } from '../constants';
import { assertItem } from '../utils/itemUtils';
import { HasMetadata } from './metadata/metadataUtils';
import { AuraEntry, SourceMetadata } from "./metadata/SourceMetadata";
import { Specifier } from "./Specifier";

export type Source = Image & HasMetadata<SourceMetadata>;

export function isSource(item: Item): item is Source {
    return isImage(item)
        && METADATA_KEY in item.metadata
        && typeof item.metadata[METADATA_KEY] === 'object';
}

export function getEntry(source: Source, sourceScopedId: string): AuraEntry | undefined {
    return source.metadata[METADATA_KEY].auras.find(aura => aura.sourceScopedId === sourceScopedId);
}

export async function updateEntry(specifier: Specifier | null, updater: (aura: AuraEntry) => void) {
    if (specifier === null) {
        return;
    }
    await OBR.scene.items.updateItems([specifier.sourceId], items => items.forEach(item => {
        assertItem(item, isSource);
        const entry = getEntry(item, specifier.sourceScopedId);
        if (entry) {
            updater(entry);
        }
    }));
}

/**
 * The item's scale is the source of truth, and the metadata follows.
 * @returns Whether the source has changed size since the last time we checked.
 *          If so, metadata needs to be updated.
 */
export function didChangeScale(source: Source) {
    return !Math2.compare(source.scale, source.metadata[METADATA_KEY].scale, VECTOR2_COMPARE_EPSILON);
}