import { isPath, isRuler, Item, ItemFilter, Metadata, Path, Ruler } from "@owlbear-rodeo/sdk";

export const PLUGIN_ID = 'com.desain.dragtool';
export const TOOL_ID = `${PLUGIN_ID}/tool`;
export const DRAG_MODE_ID = `${PLUGIN_ID}/mode-drag-item`;
export const METADATA_KEY = `${PLUGIN_ID}/metadata`;

export type DragToolMetadata = {
    distanceScaling: number,
}

export type SequenceItemMetadata = {
    type: 'SEQUENCE_ITEM',
    targetId: string,
}

export type SequenceSweepMetadata = SequenceItemMetadata & {
    /**
     * Which emanation the item is for, if it's for one (e.g it's a sweep).
     */
    emanationId: string,
}

export type SequenceRulerMetadata = SequenceItemMetadata & {
    scalingFactor: number,
};

type SequenceItemWithMetadata<ItemType, MetadataType> = ItemType & {
    metadata: Metadata & {
        [METADATA_KEY]: MetadataType,
    },
};

export type SequenceItem = SequenceItemWithMetadata<Item, SequenceItemMetadata>;
export type SequenceSweep = SequenceItemWithMetadata<Path, SequenceSweepMetadata>;
export type SequenceRuler = SequenceItemWithMetadata<Ruler, SequenceRulerMetadata>;

export type SequenceTargetMetadata = {
    type: 'SEQUENCE_TARGET',
    playerId: string,
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

export function isSequenceRuler(item: Item): item is SequenceRuler {
    return isRuler(item) && isSequenceItem(item)
        && 'scalingFactor' in item.metadata[METADATA_KEY];
}

export function isSequenceSweep(item: Item): item is SequenceSweep {
    return isPath(item) && isSequenceItem(item)
        && 'emanationId' in item.metadata[METADATA_KEY];
}

export type ItemApi = {
    updateItems(items: ItemFilter<Item> | Item[], updater: (draft: Item[]) => void): Promise<void>,
    addItems(items: Item[]): Promise<void>,
    deleteItems(ids: string[]): Promise<void>,
    getItems<ItemType extends Item>(filter?: ItemFilter<ItemType>): Promise<ItemType[]>,
    onChange(callback: (items: Item[]) => void): () => void;
    getItemAttachments(ids: string[]): Promise<Item[]>;
}