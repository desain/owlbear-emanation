import type { Vector2 } from "@owlbear-rodeo/sdk";
import type { GridParsed } from "owlbear-utils";
import { cellsToPixels, type Cells, type Pixels } from "owlbear-utils";

/**
 * @returns Square of points in pixel space centered on origin.
 */
export function buildChebyshevSquarePoints(
    grid: GridParsed,
    radius: Cells,
    absoluteItemSize: Pixels,
): Vector2[] {
    const size = cellsToPixels(radius, grid) + absoluteItemSize / 2;
    return [
        { x: -size, y: -size },
        { x: +size, y: -size },
        { x: +size, y: +size },
        { x: -size, y: +size },
    ];
}
