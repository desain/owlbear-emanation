import { Vector2 } from "@owlbear-rodeo/sdk";
import { GridParsed } from "../types/GridParsed";

/**
 * Build aura shape for manhattan aura in non-square mode.
 * @param position Position of center item.
 * @param absoluteSize Radius of aura in absolute space.
 * @param halfSize Half the width of the center item in absolute space.
 * @param halfSize Half the height of the center item in absolute space.
 * @returns Manhattan precise points in clockwise order, in pixel space centered on origin.
 */
export function buildManhattanPrecisePoints(
    grid: GridParsed,
    numUnits: number,
    absoluteItemSize: number,
): Vector2[] {
    const absoluteSize = numUnits * grid.dpi;
    const halfSize = absoluteItemSize / 2;
    return [
        { x: halfSize + absoluteSize, y: -halfSize }, // right top
        { x: halfSize + absoluteSize, y: +halfSize }, // right bottom
        { x: +halfSize, y: halfSize + absoluteSize }, // bottom right
        { x: -halfSize, y: halfSize + absoluteSize }, // bottom left
        { x: -halfSize - absoluteSize, y: +halfSize }, // left bottom
        { x: -halfSize - absoluteSize, y: -halfSize }, // left top
        { x: -halfSize, y: -halfSize - absoluteSize }, // top left
        { x: +halfSize, y: -halfSize - absoluteSize }, // top right
    ];
}

/**
 * Build first octant of manhattan aura in square mode.
 * @param radius Number of squares to extend out.
 * @returns List of points in the first octant in unit space, centered on the origin. Last point will have x=y.
 */
export function buildManhattanSquareOctant(radius: number): Vector2[] {
    const points: Vector2[] = [];
    let x = radius;
    let y = 0;
    let moveX = true;

    points.push({ x, y });

    while (x !== y) {
        if (moveX) {
            x--;
        } else {
            y++;
        }
        moveX = !moveX;

        points.push({ x, y });
    }

    return points;
}
