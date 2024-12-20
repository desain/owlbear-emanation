import OBR, { Item } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../constants";
import { removeEntry } from "../types/metadata/SourceMetadata";
import { isSource } from "../types/Source";
import { Specifier } from "../types/Specifier";
import { assertItem } from "./itemUtils";

export async function removeAura(specifier: Specifier) {
    await OBR.scene.items.updateItems([specifier.sourceId], ([source]) => {
        assertItem(source, isSource);
        removeEntry(source, specifier.sourceScopedId);
        if (source.metadata[METADATA_KEY].auras.length === 0) {
            removeItemMetadata(source);
        }
    });
}

export async function removeAuras(ids: string[]) {
    await OBR.scene.items.updateItems(ids, (items) =>
        items.forEach(removeItemMetadata),
    );
}

function removeItemMetadata(item: Item) {
    item.metadata[METADATA_KEY] = undefined;
}
