import OBR, { Item } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../constants";
import { removeEntry } from "../types/metadata/SourceMetadata";
import { isSource } from "../types/Source";
import { Specifier } from "../types/Specifier";
import { assertItem } from "./itemUtils";

export async function removeAuras(specifiers: Specifier[]) {
    const sources = specifiers.map((specifier) => specifier.sourceId);
    await OBR.scene.items.updateItems(sources, ([source]) => {
        assertItem(source, isSource);
        const sourceScopedId = specifiers.find(
            (specifier) => specifier.sourceId === source.id,
        )?.sourceScopedId!;
        removeEntry(source, sourceScopedId);
        if (source.metadata[METADATA_KEY].auras.length === 0) {
            removeItemMetadata(source);
        }
    });
}

export async function removeAllAuras(ids: string[]) {
    await OBR.scene.items.updateItems(ids, (items) =>
        items.forEach(removeItemMetadata),
    );
}

function removeItemMetadata(item: Item) {
    item.metadata[METADATA_KEY] = undefined;
}
