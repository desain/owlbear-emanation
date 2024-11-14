import { Item } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../../constants";
import { AuraStyle } from "../AuraStyle";

/**
 * Metadata on an aura source to list what effects it should have locally.
 */
export interface AuraEntry {
    style: AuraStyle;
    size: number;
    sourceScopedId: string; // for local items to copy
}

/**
 * Metadata on an aura source.
 */
export interface SourceMetadata {
    auras: AuraEntry[];
}

export function getItemMetadata(item: Item): SourceMetadata | undefined {
    return item.metadata[METADATA_KEY] as SourceMetadata | undefined;
}

function getItemMetadataOrDefault(item: Item): SourceMetadata {
    return getItemMetadata(item) ?? { auras: [] };
}

export function addEntry(item: Item, style: AuraStyle, size: number) {
    const metadata: SourceMetadata = getItemMetadataOrDefault(item);

    metadata.auras.push({
        style,
        size,
        sourceScopedId: crypto.randomUUID(),
    });

    item.metadata[METADATA_KEY] = metadata;
}
