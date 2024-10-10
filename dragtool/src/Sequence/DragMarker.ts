import { Item, KeyFilter, Shape, Vector2, buildShape, isShape } from "@owlbear-rodeo/sdk";
import { MARKER_STROKE_WIDTH_DPI_SCALING, METADATA_KEY, ZIndex } from "../constants";
import { assertHasMetadata } from "./metadataUtils";
import { SequenceTarget, createDraggingSequenceTargetMetadata, isSequenceTarget } from "./SequenceTarget";

type DragMarker = Shape & SequenceTarget;

export function createDragMarker(
    position: Vector2,
    dpi: number,
    playerColor: string,
    privateMode: boolean,
): DragMarker {
    const shape = buildShape()
        .name('Measurement Marker')
        .shapeType('CIRCLE')
        .position(position)
        .disableAutoZIndex(true)
        .zIndex(ZIndex.MARKER)
        .width(dpi / 2)
        .height(dpi / 2)
        .fillColor(playerColor)
        .fillOpacity(1)
        .strokeColor('gray')
        .strokeOpacity(1)
        .strokeDash(privateMode ? [30, 10] : [])
        .strokeWidth(dpi * MARKER_STROKE_WIDTH_DPI_SCALING)
        .locked(true)
        .layer('CONTROL')
        .metadata({ [METADATA_KEY]: createDraggingSequenceTargetMetadata() })
        .build();
    return assertHasMetadata(shape);
}

export function isDragMarker(target: Item | undefined): target is DragMarker {
    return target !== undefined && isShape(target) && isSequenceTarget(target);
}

export const DRAG_MARKER_FILTER: KeyFilter[] = [
    { key: 'type', value: 'SHAPE', coordinator: '&&' },
    { key: ['metadata', METADATA_KEY, 'type'], value: 'SEQUENCE_TARGET' }
]