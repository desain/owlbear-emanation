import { Item, Metadata } from "@owlbear-rodeo/sdk";

/**
 * An item of a specific type with metadata of a specific type.
 */
export type ItemWithMetadata<ItemType extends Item, MetadataKey extends string, MetadataType> = ItemType & {
    metadata: Metadata & {
        [Property in MetadataKey]: MetadataType;
    },
};

export function assertHasMetadata<ItemType extends Item, MetadataKey extends string, MetadataType>(item: ItemType): ItemWithMetadata<ItemType, MetadataKey, MetadataType> {
    return item as ItemWithMetadata<ItemType, MetadataKey, MetadataType>;
}