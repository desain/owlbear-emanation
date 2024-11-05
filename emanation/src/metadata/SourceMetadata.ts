import { Item, Vector2 } from '@owlbear-rodeo/sdk';
import { METADATA_KEY } from '../constants';
import { EmanationStyle } from '../types/EmanationStyle';

/**
 * Metadata on an emanation source to list what effects it should have locally.
 */
export interface EmanationEntry {
    style: EmanationStyle;
    size: number;
    sourceScopedId: string; // for local items to copy
}

/**
 * Metadata on an emanation source.
 */
export interface SourceMetadata {
    scale: Vector2; // Last seen scale for item - used to check for item scale changes
    auras: EmanationEntry[];
}

export function getItemMetadata(item: Item): SourceMetadata | undefined {
    return item.metadata[METADATA_KEY] as SourceMetadata | undefined;
}

function getItemMetadataOrDefault(item: Item): SourceMetadata {
    return getItemMetadata(item) ?? {
        scale: item.scale,
        auras: [],
    };
}

export function addEntry(item: Item, style: EmanationStyle, size: number) {
    const metadata: SourceMetadata = getItemMetadataOrDefault(item);

    metadata.auras.push({
        style,
        size,
        sourceScopedId: crypto.randomUUID(),
    });

    item.metadata[METADATA_KEY] = metadata;
}