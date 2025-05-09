import type { Vector2 } from "@owlbear-rodeo/sdk";
import type { GridParsed } from "owlbear-utils";
import {
    cellsToPixels,
    floorCells,
    type Cells,
    type Pixels,
} from "owlbear-utils";

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
    radius: Cells,
    absoluteItemSize: Pixels,
): Vector2[] {
    const sizePx = cellsToPixels(radius, grid);
    const halfItemSize = absoluteItemSize / 2;
    return [
        { x: halfItemSize + sizePx, y: -halfItemSize }, // right top
        { x: halfItemSize + sizePx, y: +halfItemSize }, // right bottom
        { x: +halfItemSize, y: halfItemSize + sizePx }, // bottom right
        { x: -halfItemSize, y: halfItemSize + sizePx }, // bottom left
        { x: -halfItemSize - sizePx, y: +halfItemSize }, // left bottom
        { x: -halfItemSize - sizePx, y: -halfItemSize }, // left top
        { x: -halfItemSize, y: -halfItemSize - sizePx }, // top left
        { x: +halfItemSize, y: -halfItemSize - sizePx }, // top right
    ];
}

/**
 * Build first octant of manhattan aura in square mode.
 * @param radius Number of squares to extend out.
 * @returns List of points in the first octant in unit space, centered on the origin. Last point will have x=y.
 */
export function buildManhattanSquareOctant(radius: Cells): Vector2[] {
    const points: Vector2[] = [];
    let x = floorCells(radius);
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
