import { Item } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../../constants";
import { isDeepEqual } from "../../utils/jsUtils";
import { AuraStyle, getBlendMode } from "../AuraStyle";
import { Source } from "../Source";

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
    /**
     * Player IDs that can see this aura. If not set, the aura is visible to all players.
     */
    visibleTo?: string;
}

/**
 * Metadata on an aura source.
 */
export interface SourceMetadata {
    auras: AuraEntry[];
}

export function addEntry(item: Item, style: AuraStyle, size: number) {
    const metadata: SourceMetadata = (item.metadata[METADATA_KEY] as
        | SourceMetadata
        | undefined) ?? {
        auras: [],
    };

    metadata.auras.push({
        style,
        size,
        sourceScopedId: crypto.randomUUID(),
    });

    item.metadata[METADATA_KEY] = metadata;
}

export function removeEntry(source: Source, sourceScopedId: string) {
    source.metadata[METADATA_KEY].auras = source.metadata[
        METADATA_KEY
    ].auras.filter((entry) => entry.sourceScopedId !== sourceScopedId);
}

/**
 * @returns Whether the aura's parameters have changed in a way that requires
 *          fully rebuilding the aura.
 */
export function buildParamsChanged(oldEntry: AuraEntry, newEntry: AuraEntry) {
    return (
        oldEntry.size !== newEntry.size ||
        oldEntry.style.type !== newEntry.style.type ||
        // Not sure why, but updating the blend mode directly on effect items doesn't work,
        // so we need to rebuild the aura if the blend mode changes.
        getBlendMode(oldEntry.style) !== getBlendMode(newEntry.style)
    );
}

/**
 * @returns Whether the aura's parameters have changed in a way that can be
 *          updated without rebuilding the aura.
 */
export function drawingParamsChanged(oldEntry: AuraEntry, newEntry: AuraEntry) {
    return !isDeepEqual(oldEntry.style, newEntry.style);
}
