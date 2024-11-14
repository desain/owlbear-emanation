import { Item } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../../constants";
import { isDeepEqual } from "../../utils/jsUtils";
import { AuraStyle } from "../AuraStyle";

/**
 * Metadata on an aura source to list what effects it should have locally.
 */
export interface AuraEntry {
    /**
     * Id which uniquely identifies the aura in the owning source's list of auras.
     * Two sources may have auras with the same scoped id if they are created by duplicating
     * a source that already has an aura.
     */
    sourceScopedId: string;
    style: AuraStyle;
    size: number;
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

/**
 * @returns Whether the aura's parameters have changed in a way that requires
 *          fully rebuilding the aura.
 */
export function buildParamsChanged(oldEntry: AuraEntry, newEntry: AuraEntry) {
    return (
        oldEntry.size !== newEntry.size ||
        oldEntry.style.type !== newEntry.style.type
    );
}

/**
 * @returns Whether the aura's parameters have changed in a way that can be
 *          updated without rebuilding the aura.
 */
export function drawingParamsChanged(oldEntry: AuraEntry, newEntry: AuraEntry) {
    return !isDeepEqual(oldEntry.style, newEntry.style);
}
