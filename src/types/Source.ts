import OBR, { Item } from "@owlbear-rodeo/sdk";

import { METADATA_KEY } from "../constants";
import { assertItem } from "../utils/itemUtils";
import { CandidateSource, isCandidateSource } from "./CandidateSource";
import { HasMetadata } from "./metadata/metadataUtils";
import { AuraEntry, SourceMetadata } from "./metadata/SourceMetadata";
import { Specifier } from "./Specifier";

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
    const sources = specifiers.map((specifier) => specifier.sourceId);
    return await OBR.scene.items.updateItems(sources, (items) =>
        items.forEach((source) => {
            assertItem(source, isSource);
            const sourceScopedId = specifiers.find(
                (specifier) => specifier.sourceId === source.id,
            )?.sourceScopedId!;
            const entry = getEntry(source, sourceScopedId);
            if (entry) {
                updater(entry);
            }
        }),
    );
}
