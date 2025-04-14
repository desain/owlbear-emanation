import { Item } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../../constants";
import { AuraConfig } from "../AuraConfig";
import { Source } from "../Source";

/**
 * Metadata for each aura.
 */
export interface AuraEntry extends AuraConfig {
    /**
     * Id which uniquely identifies the aura in the owning source's list of auras.
     * Two sources may have auras with the same scoped id if they are created by duplicating
     * a source that already has an aura.
     */
    sourceScopedId: string;
}

/**
 * Metadata on an aura source.
 */
export interface SourceMetadata {
    auras: AuraEntry[];
}

export function addEntry(item: Item, config: AuraConfig) {
    const metadata: SourceMetadata = (item.metadata[METADATA_KEY] as
        | SourceMetadata
        | undefined) ?? {
        auras: [],
    };

    const entry = {
        size: config.size,
        style: config.style,
        visibleTo: config.visibleTo,
        layer: config.layer,
        sourceScopedId: crypto.randomUUID(),
    };
    metadata.auras.push(entry);
    item.metadata[METADATA_KEY] = metadata;
}

export function removeEntry(source: Source, sourceScopedId: string) {
    source.metadata[METADATA_KEY].auras = source.metadata[
        METADATA_KEY
    ].auras.filter((entry) => entry.sourceScopedId !== sourceScopedId);
}
