import OBR, { Image, Item, KeyFilter, Layer, Math2, Ruler, Shape, Vector2, buildPath, buildShape, isImage, isRuler, isShape } from "@owlbear-rodeo/sdk";
import { GenericItemBuilder } from "@owlbear-rodeo/sdk/lib/builders/GenericItemBuilder";
import { Emanation, isEmanation, } from "../../emanation/src/types";
import { ItemApi, METADATA_KEY, SequenceItem, SequenceItemMetadata, SequenceSweep, SequenceTargetMetadata, isSequenceItem, isSequenceRuler, isSequenceTarget } from "./dragtoolTypes";
import { withBothItemApis } from "./interactionUtils";

export function isDraggableItem(target: Item | undefined, requireUnlocked: boolean = true): target is Image {
    return target !== undefined
        && isImage(target)
        && (!requireUnlocked || !target.locked)
        && (target.layer === 'CHARACTER' || target.layer === 'MOUNT');
}
export const DRAGGABLE_ITEM_FILTER: KeyFilter[] = [
    {
        key: 'layer',
        value: 'CHARACTER',
        coordinator: '||',
    },
    {
        key: 'layer',
        value: 'MOUNT',
        coordinator: '&&',
    },
    {
        key: 'type',
        value: 'IMAGE',
        coordinator: '&&',
    },
    {
        key: 'locked',
        value: false,
    },
];
export const NOT_DRAGGABLE_ITEM_FILTER: KeyFilter[] = [
    {
        key: 'layer',
        operator: '!=',
        value: 'CHARACTER',
        coordinator: '&&',
    },
    {
        key: 'layer',
        operator: '!=',
        value: 'MOUNT',
        coordinator: '||',
    },
    {
        key: 'type',
        operator: '!=',
        value: 'IMAGE',
        coordinator: '||',
    },
    {
        key: 'locked',
        value: true,
    },
];
export function createDragMarker(
    position: Vector2,
    dpi: number,
    playerColor: string,
    markerStrokeWidth: number,
    layer: Layer,
    zIndex: number,
    privateMode: boolean,
) {
    return buildShape()
        .name('Measurement Marker')
        .shapeType('CIRCLE')
        .position(position)
        .disableAutoZIndex(true)
        .zIndex(zIndex)
        .width(dpi / 2)
        .height(dpi / 2)
        .fillColor(playerColor)
        .fillOpacity(1)
        .strokeColor('gray')
        .strokeOpacity(1)
        .strokeDash(privateMode ? [30, 10] : [])
        .strokeWidth(markerStrokeWidth)
        .locked(true)
        .layer(layer)
        .metadata({ [METADATA_KEY]: createSequenceTargetMetadata() })
        .build();
}
export function isIndependentDragMarker(target: Item | undefined): target is Shape & SequenceItem {
    return target !== undefined && isShape(target) && isSequenceTarget(target);
}
export const DRAG_MARKER_FILTER: KeyFilter[] = [
    { key: 'type', value: 'SHAPE', coordinator: '&&' },
    { key: ['metadata', METADATA_KEY, 'type'], value: 'SEQUENCE_TARGET' }
]

export async function getEmanations(id: string, api: ItemApi): Promise<Emanation[]> {
    return (await api.getItemAttachments([id])).filter(isEmanation);
}

export function buildSequenceItem<
    MetadataType extends SequenceItemMetadata,
    Builder extends GenericItemBuilder<Builder> & { build(): Item },
>(
    target: Item,
    layer: Layer,
    zIndex: number | null,
    metadata: Omit<MetadataType, keyof SequenceItemMetadata>,
    builder: Builder,
): ReturnType<Builder['build']> & { metadata: { [METADATA_KEY]: MetadataType } } {
    const builder2 = builder
        .disableHit(true)
        .disableAutoZIndex(zIndex !== null)
        .zIndex(zIndex!)
        .locked(true)
        .visible(target.visible)
        .layer(layer)
        .attachedTo('omg')
        .metadata({
            // assuming this is all that's needed to create a MetadataType - don't manually pass in a type param more restrictive
            [METADATA_KEY]: { ...metadata, ...createSequenceItemMetadata(target.id) }
        }) as Builder & { build(): ReturnType<Builder['build']> & { metadata: { [METADATA_KEY]: MetadataType } } };
    return builder2.build() as ReturnType<(typeof builder2)['build']>;
}

export function itemMovedOutsideItsSequence(item: Item, items: Item[]): boolean {
    const rulers = items.filter(belongsToSequenceForTarget(item.id))
        .filter(isRuler) as (SequenceItem & Ruler)[]; // Typescript can't figure out that isRuler guarantees ruler here for some reason
    const previousPositions: Vector2[] = rulers.flatMap((ruler) => [ruler.startPosition, ruler.endPosition]);
    for (const position of previousPositions) {
        if (Math2.compare(item.position, position, 0.01)) {
            return false;
        }
    }
    return true;
}

export async function deleteSequence(target: Item, api: ItemApi) {
    // console.log('deleting sequence for', target.id);
    const toDelete = (await api.getItems(belongsToSequenceForTarget(target.id)))
        .map((item) => item.id);
    if (isIndependentDragMarker(target)) {
        toDelete.push(target.id);
    } else {
        await api.updateItems([target], ([target]) => {
            target.metadata[METADATA_KEY] = {};
        });
    }
    await api.deleteItems(toDelete);
}

export async function deleteAllSequencesForCurrentPlayer() {
    // console.log('deleting all for current');
    withBothItemApis(async (api) => {
        const sequenceTargets = await api.getItems(isSequenceTarget);
        await Promise.all(
            sequenceTargets
                .filter((target) => target.metadata[METADATA_KEY].playerId === OBR.player.id)
                .map((target) => deleteSequence(target, api))
        );
    });
}

export async function getSequenceLength(targetId: string, api: ItemApi) {
    return (await Promise.all(
        (await api.getItems(isSequenceRuler))
            .filter(belongsToSequenceForTarget(targetId))
            .map(async (ruler) => {
                const distance = await OBR.scene.grid.getDistance(ruler.startPosition, ruler.endPosition);
                return distance * ruler.metadata[METADATA_KEY].scalingFactor;
            })
    )).reduce((a, b) => a + b, 0);
}

export async function getOrCreateSweep(target: Item, emanation: Emanation, existingSweeps: SequenceSweep[]): Promise<SequenceSweep> {
    const existingSweep = existingSweeps.find((sweep) => sweep.metadata[METADATA_KEY].emanationId === emanation.id);
    if (existingSweep) {
        return existingSweep;
    } else {
        const sweep: SequenceSweep = buildSequenceItem(target, 'DRAWING', null, { emanationId: emanation.id }, buildPath()
            .position({ x: 0, y: 0 })
            .commands([])
            .strokeWidth(emanation.style.strokeWidth)
            .strokeColor(emanation.style.strokeColor)
            .strokeDash(emanation.style.strokeDash)
            .strokeOpacity(0)
            .fillColor(emanation.style.fillColor)
            .fillOpacity(emanation.style.fillOpacity)
            .fillRule('nonzero')); // todo how to typecheck this?
        return sweep;
    }
}

export function createSequenceItemMetadata(targetId: string): SequenceItemMetadata {
    return { type: 'SEQUENCE_ITEM', targetId };
}

export function createSequenceTargetMetadata(): SequenceTargetMetadata {
    return { type: 'SEQUENCE_TARGET', playerId: OBR.player.id };
}

export function belongsToSequenceForTarget(targetId: string): (item: Item) => item is SequenceItem {
    return (item): item is SequenceItem => isSequenceItem(item) && item.metadata[METADATA_KEY].targetId === targetId;
}