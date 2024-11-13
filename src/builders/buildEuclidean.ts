import { Vector2, buildShape } from "@owlbear-rodeo/sdk";
import { Circle } from "../types/Aura";

/**
 * Build basic shape.
 * @param widthHeight Width and height of shape.
 * @param position Position of shape.
 * @param shapeType Type of shape.
 * @returns Shape item.
 */
export function buildEuclideanAura(
    position: Vector2,
    numUnits: number,
    unitSize: number,
    absoluteItemSize: number,
): Circle {
    const diameter = numUnits * unitSize * 2 + absoluteItemSize;
    return buildShape()
        .width(diameter)
        .height(diameter)
        .position(position)
        .shapeType('CIRCLE')
        .build() as Circle; // typescript doesn't know about builders
}