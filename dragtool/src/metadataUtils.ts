import { Metadata } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "./constants";

export type ItemWithMetadata<ItemType, MetadataType> = ItemType & {
    metadata: Metadata & {
        [METADATA_KEY]: MetadataType,
    },
};

export function assertHasMetadata<T, MetadataType>(t: T): T & { metadata: { [METADATA_KEY]: MetadataType } } {
    return t as T & { metadata: { [METADATA_KEY]: MetadataType } };
}