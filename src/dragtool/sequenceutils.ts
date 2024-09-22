import OBR, { Image, Item, KeyFilter, Layer, Math2, Path, Ruler, Shape, Vector2, buildPath, buildShape, isImage, isPath, isRuler, isShape } from "@owlbear-rodeo/sdk";
import { GenericItemBuilder } from "@owlbear-rodeo/sdk/lib/builders/GenericItemBuilder";
import { Emanation, isEmanation, } from "../types";
import { ItemApi, METADATA_KEY, SequenceItem, SequenceItemMetadata, SequenceTargetMetadata, isSequenceItem, isSequenceTarget } from "./dragtoolTypes";

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

export function buildSequenceItem<Built extends Item, Builder extends GenericItemBuilder<Builder> & { build: () => Built }>(
    target: Item,
    layer: Layer,
    zIndex: number | null,
    builder: Builder,
): Built & SequenceItem {
    const built: Built = builder
        .disableHit(true)
        .disableAutoZIndex(zIndex !== null)
        .zIndex(zIndex!)
        .locked(true)
        .visible(target.visible)
        .layer(layer)
        .metadata({ [METADATA_KEY]: createSequenceItemMetadata(target.id) })
        .build();
    const returnValue: Built & SequenceItem = built as typeof built & { metadata: { [METADATA_KEY]: SequenceItemMetadata } };
    return returnValue;
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

export async function deleteAllSequencesForCurrentPlayer(api: ItemApi) {
    // console.log('deleting all for current');
    const sequenceTargets = await api.getItems(isSequenceTarget);
    await Promise.all(
        sequenceTargets
            .filter((target) => target.metadata[METADATA_KEY].playerId === OBR.player.id)
            .map((target) => deleteSequence(target, api))
    );
}

export async function getSequenceLength(targetId: string, api: ItemApi) {
    return (await Promise.all(
        (await api.getItems(isRuler))
            .filter(belongsToSequenceForTarget(targetId))
            .map((ruler) => OBR.scene.grid.getDistance(ruler.startPosition, ruler.endPosition))
    )).reduce((a, b) => a + b, 0);
}

export async function getOrCreateSweeps(target: Item, emanations: Emanation[], api: ItemApi): Promise<Path[]> {
    if (target === null) {
        return [];
    }
    const existingSweeps: (SequenceItem & Path)[] = (await api.getItems(belongsToSequenceForTarget(target.id)))
        .filter(isPath) as (SequenceItem & Path)[];
    const sweeps: Path[] = [];
    for (const emanation of emanations) {
        const existingSweep = existingSweeps.find((sweep) => sweep.metadata[METADATA_KEY]?.emanationId === emanation.id);
        if (existingSweep) {
            sweeps.push(existingSweep);
        } else {
            const sweep: Path & SequenceItem = buildSequenceItem(target, 'DRAWING', null, buildPath()
                .position({ x: 0, y: 0 })
                .commands([])
                .strokeWidth(emanation.style.strokeWidth)
                .strokeColor(emanation.style.strokeColor)
                .strokeDash(emanation.style.strokeDash)
                .strokeOpacity(0)
                .fillColor(emanation.style.fillColor)
                .fillOpacity(emanation.style.fillOpacity)
                .fillRule('nonzero'));
            sweep.metadata[METADATA_KEY].emanationId = emanation.id;
            sweeps.push(sweep);
        }
    }
    return sweeps;
}

export function createSequenceItemMetadata(targetId: string, emanationId: string | undefined = undefined): SequenceItemMetadata {
    return { type: 'SEQUENCE_ITEM', targetId, emanationId };
}

export function createSequenceTargetMetadata(): SequenceTargetMetadata {
    return { type: 'SEQUENCE_TARGET', playerId: OBR.player.id };
}

export function belongsToSequenceForTarget(targetId: string): (item: Item) => item is SequenceItem {
    return (item): item is SequenceItem => isSequenceItem(item) && item.metadata[METADATA_KEY].targetId === targetId;
}