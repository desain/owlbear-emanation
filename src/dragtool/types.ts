import { Item, Metadata } from "@owlbear-rodeo/sdk";

export const PLUGIN_ID = 'com.desain.dragtool';
export const TOOL_ID = `${PLUGIN_ID}/tool`;
export const METADATA_KEY = `${PLUGIN_ID}/metadata`;

export type SequenceItemMetadata = {
    type: 'SEQUENCE_ITEM',
    targetId: string,
    /**
     * Which emanation the item is for, if it's for one (e.g it's a sweep).
     */
    emanationId?: string,
}

export type SequenceTargetMetadata = {
    type: 'SEQUENCE_TARGET',
    playerId: string,
}

export type SequenceItem = Item & {
    metadata: Metadata & {
        [METADATA_KEY]: SequenceItemMetadata,
    },
}

export type SequenceTarget = Item & {
    metadata: Metadata & {
        [METADATA_KEY]: SequenceTargetMetadata,
    },
}

export function isSequenceItem(item: Item): item is SequenceItem {
    const metadata = item.metadata[METADATA_KEY];
    return typeof metadata === 'object'
        && metadata !== null
        && 'type' in metadata
        && metadata.type === 'SEQUENCE_ITEM';
}

export function isSequenceTarget(item: Item): item is SequenceTarget {
    const metadata = item.metadata[METADATA_KEY];
    return typeof metadata === 'object'
        && metadata !== null
        && 'type' in metadata
        && metadata.type === 'SEQUENCE_TARGET'
}