import { isImage, Item } from "@owlbear-rodeo/sdk";

import { METADATA_KEY } from "../constants";
import { CandidateSource, isCandidateSource } from "./CandidateSource";
import { HasMetadata } from "./metadata/metadataUtils";
import { AuraEntry, SourceMetadata } from "./metadata/SourceMetadata";
import { forEachSpecifier, Specifier } from "./Specifier";

export type Source = CandidateSource & HasMetadata<SourceMetadata>;

export function isSource(item: Item): item is Source {
    return (
        isCandidateSource(item) &&
        METADATA_KEY in item.metadata &&
        typeof item.metadata[METADATA_KEY] === "object"
    );
}

export function getEntry(
    source: Item | undefined,
    sourceScopedId: string,
): AuraEntry | undefined {
    if (source === undefined || !isSource(source)) {
        return undefined;
    }
    return source.metadata[METADATA_KEY].auras.find(
        (aura) => aura.sourceScopedId === sourceScopedId,
    );
}

export async function updateEntries(
    specifiers: Specifier[],
    updater: (aura: AuraEntry) => void,
) {
    return await forEachSpecifier(specifiers, (source, sourceScopedId) => {
        const entry = getEntry(source, sourceScopedId);
        if (entry) {
            updater(entry);
        }
    });
}

export function getSourceName(source: Source): string {
    if (isImage(source) && source.text.plainText) {
        return source.text.plainText;
    }
    return source.name;
}

export function getSourceImage(source: Source): string | undefined {
    if (isImage(source)) {
        return source.image.url;
    }
    return undefined;
}
