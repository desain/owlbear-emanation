import { Vector2 } from "@owlbear-rodeo/sdk";
import { GridParsed } from "../types/GridParsed";

/**
 * @returns Square of points in pixel space centered on origin.
 */
export function buildChebyshevSquarePoints(
    grid: GridParsed,
    numUnits: number,
    absoluteItemSize: number,
): Vector2[] {
    const size = numUnits * grid.dpi + absoluteItemSize / 2;
    return [
        { x: -size, y: -size },
        { x: +size, y: -size },
        { x: +size, y: +size },
        { x: -size, y: +size },
    ];
}
