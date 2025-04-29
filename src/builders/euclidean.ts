import { buildShape, Vector2 } from "@owlbear-rodeo/sdk";
import { GridParsed } from "owlbear-utils";
import { Circle } from "../types/Circle";

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
    numUnits: number,
    absoluteItemSize: number,
    scale: Vector2,
): Circle {
    const diameter = numUnits * grid.dpi * 2 + absoluteItemSize;
    return buildShape()
        .width(diameter * scale.x)
        .height(diameter * scale.y)
        .position(position)
        .shapeType("CIRCLE")
        .build() as Circle; // typescript doesn't know about builders
}
