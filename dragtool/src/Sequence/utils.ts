import OBR, { buildPath, isRuler, Item, Math2, Ruler, Vector2 } from "@owlbear-rodeo/sdk";
import { Emanation, isEmanation, } from "../../../emanation/src/Emanation";
import { METADATA_KEY } from "../constants";
import { ItemApi, withBothItemApis } from "../ItemApi";
import { isDragMarker } from "./DragMarker";
import { isSegment } from "./Segment";
import { buildSequenceItem, isSequenceItem, SequenceItem } from "./SequenceItem";
import { SequenceSweep } from "./SequenceSweep";
import { isSequenceTarget } from "./SequenceTarget";

export async function getEmanations(id: string, api: ItemApi): Promise<Emanation[]> {
    return (await api.getItemAttachments([id])).filter(isEmanation);
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
    if (isDragMarker(target)) {
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
        (await api.getItems(isSegment))
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

export function belongsToSequenceForTarget(targetId: string): (item: Item) => item is SequenceItem {
    return (item): item is SequenceItem => isSequenceItem(item) && item.metadata[METADATA_KEY].targetId === targetId;
}