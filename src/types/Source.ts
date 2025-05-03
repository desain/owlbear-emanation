import type { Item } from "@owlbear-rodeo/sdk";
import { isImage } from "@owlbear-rodeo/sdk";

import { METADATA_KEY } from "../constants";
import type { CandidateSource} from "./CandidateSource";
import { isCandidateSource } from "./CandidateSource";
import type { HasMetadata } from "./metadata/metadataUtils";
import type {
    AuraEntry,
    SourceMetadata} from "./metadata/SourceMetadata";
import {
    isSourceMetadata
} from "./metadata/SourceMetadata";
import type { Specifier } from "./Specifier";
import { forEachSpecifier } from "./Specifier";

export type Source = CandidateSource & HasMetadata<SourceMetadata>;

export function isSource(item: Item): item is Source {
    return (
        isCandidateSource(item) &&
        METADATA_KEY in item.metadata &&
        isSourceMetadata(item.metadata[METADATA_KEY])
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

export function getSourceImage(source: Source): string | undefined {
    if (isImage(source)) {
        return source.image.url;
    }
    return undefined;
}
