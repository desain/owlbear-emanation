import { Item, Metadata } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../constants";

/**
 * An item with metadata of a specific type.
 */
export type ItemWithMetadata<ItemType extends Item, MetadataType> = ItemType & {
    metadata: Metadata & {
        [METADATA_KEY]: MetadataType,
    },
};

export function assertHasMetadata<ItemType extends Item, MetadataType>(item: ItemType): ItemWithMetadata<ItemType, MetadataType> {
    return item as ItemWithMetadata<ItemType, MetadataType>;
}