import type { Item } from "@owlbear-rodeo/sdk";
import { isObject } from "owlbear-utils";
import { METADATA_KEY } from "../../constants";
import type { AuraConfig} from "../AuraConfig";
import { isAuraConfig } from "../AuraConfig";
import type { Source } from "../Source";

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
function isAuraEntry(entry: unknown): entry is AuraEntry {
    return (
        isAuraConfig(entry) &&
        "sourceScopedId" in entry &&
        typeof entry.sourceScopedId === "string"
    );
}

/**
 * Metadata on an aura source.
 */
export interface SourceMetadata {
    auras: AuraEntry[];
}
export function isSourceMetadata(
    metadata: unknown,
): metadata is SourceMetadata {
    return (
        isObject(metadata) &&
        "auras" in metadata &&
        Array.isArray(metadata.auras) &&
        metadata.auras.every(isAuraEntry)
    );
}

export function addEntry(item: Item, config: AuraConfig) {
    const metadata: SourceMetadata = isSourceMetadata(
        item.metadata[METADATA_KEY],
    )
        ? item.metadata[METADATA_KEY]
        : {
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
