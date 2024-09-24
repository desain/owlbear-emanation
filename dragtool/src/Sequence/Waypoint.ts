import { Item, Layer, Shape, buildShape } from "@owlbear-rodeo/sdk";
import { MARKER_STROKE_WIDTH_DPI_SCALING, ZIndex } from "../constants";
import { SequenceItem, buildSequenceItem } from "./SequenceItem";

export type Waypoint = Shape & SequenceItem;

export function createWaypoint(target: Item, layer: Layer, dpi: number, color: string): Waypoint {
    return buildSequenceItem(target, layer, ZIndex.WAYPOINT, {}, buildShape()
        .name(`Path Waypoint for ${target.name}`)
        .position(target.position)
        .shapeType('CIRCLE')
        .width(dpi / 4)
        .height(dpi / 4)
        .fillColor(color)
        .strokeColor('gray')
        .strokeWidth(dpi * MARKER_STROKE_WIDTH_DPI_SCALING));
}