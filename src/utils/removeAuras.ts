import OBR, { Item } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../constants";
import { removeEntry } from "../types/metadata/SourceMetadata";
import { forEachSpecifier, Specifier } from "../types/Specifier";

export async function removeAuras(specifiers: Specifier[]) {
    return await forEachSpecifier(specifiers, (source, sourceScopedId) => {
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
