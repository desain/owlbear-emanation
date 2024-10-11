import { buildRuler, GridScale, isRuler, Item, Layer, Ruler, Vector2 } from "@owlbear-rodeo/sdk";
import { METADATA_KEY, ZIndex } from "../constants";
import { ItemWithMetadata } from "./metadataUtils";
import { buildSequenceItem, isSequenceItem, SequenceItemMetadata } from "./SequenceItem";


type SegmentMetadata = SequenceItemMetadata & {
    scalingFactor: number,
};

export type Segment = ItemWithMetadata<Ruler, typeof METADATA_KEY, SegmentMetadata>;

export function isSegment(item: Item): item is Segment {
    return isRuler(item) && isSequenceItem(item)
        && 'scalingFactor' in item.metadata[METADATA_KEY];
}

export function createSegment(target: Item, end: Vector2, layer: Layer, scalingFactor: number): Segment {
    return buildSequenceItem(target, layer, ZIndex.RULER, { scalingFactor }, buildRuler()
        .name(`Path Ruler for ${target.name}`)
        .startPosition(target.position)
        .endPosition(end)
        .variant('DASHED'));
}

export function getSegmentText(numGridUnits: number, scale: GridScale, scalingFactor: number) {
    const xFactorText = scalingFactor === 1 ? '' : `x${scalingFactor}`;
    return `${Math.round(numGridUnits * scale.parsed.multiplier)}${xFactorText}${scale.parsed.unit}`;
}