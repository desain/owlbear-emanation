import type { Vector2 } from "@owlbear-rodeo/sdk";
import { buildShape } from "@owlbear-rodeo/sdk";
import type { GridParsed } from "owlbear-utils";
import { cellsToPixels, type Cells, type Pixels } from "owlbear-utils";
import type { Circle } from "../types/Circle";
import { getAuraPosition } from "./buildAura";

/**
 * Build basic shape.
 * @param widthHeight Width and height of shape.
 * @param position Position of shape.
 * @param shapeType Type of shape.
 * @returns Shape item.
 */
export function buildEuclideanAura(
    grid: GridParsed,
    position: Vector2,
    offset: Vector2 | undefined,
    radius: Cells,
    absoluteItemSize: Pixels,
    scale: Vector2,
): Circle {
    const diameter = cellsToPixels(radius, grid) * 2 + absoluteItemSize;
    return buildShape()
        .width(diameter * scale.x)
        .height(diameter * scale.y)
        .position(getAuraPosition(position, offset))
        .shapeType("CIRCLE")
        .build() as Circle; // typescript doesn't know about builders
}
