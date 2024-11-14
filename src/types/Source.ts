import OBR, { Image, isImage, Item } from "@owlbear-rodeo/sdk";

import { METADATA_KEY } from "../constants";
import { assertItem } from "../utils/itemUtils";
import { HasMetadata } from "./metadata/metadataUtils";
import { AuraEntry, SourceMetadata } from "./metadata/SourceMetadata";
import { Specifier } from "./Specifier";

export type Source = Image & HasMetadata<SourceMetadata>;

export function isSource(item: Item): item is Source {
    return (
        isImage(item) &&
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

export async function updateEntry(
    specifier: Specifier | null,
    updater: (aura: AuraEntry) => void,
) {
    if (specifier === null) {
        return;
    }
    return await OBR.scene.items.updateItems([specifier.sourceId], (items) =>
        items.forEach((item) => {
            assertItem(item, isSource);
            const entry = getEntry(item, specifier.sourceScopedId);
            if (entry) {
                updater(entry);
            }
        }),
    );
}
