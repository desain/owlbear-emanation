import OBR, { Image, Item, KeyFilter, Math2, Path, Ruler, Shape, Vector2, buildPath, buildShape, isImage, isPath, isRuler, isShape } from "@owlbear-rodeo/sdk";
import { GenericItemBuilder } from "@owlbear-rodeo/sdk/lib/builders/GenericItemBuilder";
import { Emanation, isEmanation, } from "../types";
import { METADATA_KEY, SequenceItem, SequenceItemMetadata, SequenceTargetMetadata, isSequenceItem, isSequenceTarget } from "./dragtoolTypes";

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
export function createDragMarker(position: Vector2, dpi: number, playerColor: string, markerStrokeWidth: number) {
    return buildShape()
        .name('Measurement Marker')
        .shapeType('CIRCLE')
        .position(position)
        .width(dpi / 2)
        .height(dpi / 2)
        .fillColor(playerColor)
        .fillOpacity(1)
        .strokeColor('gray')
        .strokeOpacity(1)
        .strokeWidth(markerStrokeWidth)
        .locked(true)
        .layer('RULER')
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

export async function getEmanations(id: string | undefined): Promise<Emanation[]> {
    if (id === undefined) {
        return [];
    } else {
        return (await OBR.scene.items.getItemAttachments([id])).filter(isEmanation);
    }
}

export function buildSequenceItem<Built extends Item, Builder extends GenericItemBuilder<Builder> & { build: () => Built }>(
    target: Item,
    metadata: SequenceItemMetadata,
    builder: Builder
): Built & SequenceItem {
    const built: Built = builder
        .disableHit(true)
        .locked(true)
        .visible(target.visible)
        .layer('RULER')
        .metadata({ [METADATA_KEY]: metadata })
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

export async function deleteSequence(target: Item) {
    // console.log('deleting sequence for', target.id);
    const toDelete = (await OBR.scene.items.getItems(belongsToSequenceForTarget(target.id)))
        .map((item) => item.id);
    if (isIndependentDragMarker(target)) {
        toDelete.push(target.id);
    } else {
        await OBR.scene.items.updateItems([target], ([target]) => {
            target.metadata[METADATA_KEY] = {};
        });
    }
    await OBR.scene.items.deleteItems(toDelete);
}

export async function deleteAllSequencesForCurrentPlayer() {
    // console.log('deleting all for current');
    const sequences = await OBR.scene.items.getItems(isSequenceTarget);
    await Promise.all(sequences
        .filter((sequence) => sequence.metadata[METADATA_KEY].playerId === OBR.player.id)
        .map(deleteSequence));
}

export async function getSequenceLength(targetId: string) {
    return (await Promise.all(
        (await OBR.scene.items.getItems(isRuler))
            .filter(belongsToSequenceForTarget(targetId))
            .map((ruler) => OBR.scene.grid.getDistance(ruler.startPosition, ruler.endPosition))
    )).reduce((a, b) => a + b, 0);
}

export async function getOrCreateSweeps(target: Item, emanations: Emanation[]): Promise<Path[]> {
    if (target === null) {
        return [];
    }
    const existingSweeps: (SequenceItem & Path)[] = (await OBR.scene.items.getItems(belongsToSequenceForTarget(target.id)))
        .filter(isPath) as (SequenceItem & Path)[];
    const sweeps: Path[] = [];
    for (const emanation of emanations) {
        const existingSweep = existingSweeps.find((sweep) => sweep.metadata[METADATA_KEY]?.emanationId === emanation.id);
        if (existingSweep) {
            sweeps.push(existingSweep);
        } else {
            const sweep: Path = buildSequenceItem(target, createSequenceItemMetadata(target.id, emanation.id), buildPath()
                .position({ x: 0, y: 0 })
                .commands([])
                .strokeWidth(emanation.style.strokeWidth)
                .strokeColor(emanation.style.strokeColor)
                .strokeDash(emanation.style.strokeDash)
                .strokeOpacity(0)
                .fillColor(emanation.style.fillColor)
                .fillOpacity(emanation.style.fillOpacity)
                .layer('DRAWING')
                .fillRule('nonzero'));
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