import { isPath, Item, Path } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../constants";
import { ItemWithMetadata } from "../metadataUtils";
import { isSequenceItem, SequenceItemMetadata } from "./SequenceItem";

export type SequenceSweepMetadata = SequenceItemMetadata & {
    /**
     * Which emanation the item is for, if it's for one (e.g it's a sweep).
     */
    emanationId: string;
}

export type SequenceSweep = ItemWithMetadata<Path, SequenceSweepMetadata>;

export function isSequenceSweep(item: Item): item is SequenceSweep {
    return isPath(item) && isSequenceItem(item)
        && 'emanationId' in item.metadata[METADATA_KEY];
}