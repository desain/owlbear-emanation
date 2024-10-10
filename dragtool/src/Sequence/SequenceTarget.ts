import OBR, { Item } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../constants";
import { ItemWithMetadata } from "./metadataUtils";

export type SequenceTargetMetadata = {
    type: 'SEQUENCE_TARGET',
    playerId: string,
    activelyDragging: boolean, // TODO track this in memory instead?
}

export function createDraggingSequenceTargetMetadata(): SequenceTargetMetadata {
    return { type: 'SEQUENCE_TARGET', playerId: OBR.player.id, activelyDragging: true };
}

export type SequenceTarget = ItemWithMetadata<Item, SequenceTargetMetadata>;

export function isSequenceTarget(item: Item): item is SequenceTarget {
    const metadata = item.metadata[METADATA_KEY];
    return typeof metadata === 'object'
        && metadata !== null
        && 'type' in metadata
        && metadata.type === 'SEQUENCE_TARGET'
}