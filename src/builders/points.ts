import type { Vector2 } from "@owlbear-rodeo/sdk";
import { Math2 } from "@owlbear-rodeo/sdk";
import type { GridParsed } from "owlbear-utils";
import {
    cells,
    cellsToPixels,
    pixels,
    roundCells,
    type Cells,
    type Pixels,
} from "owlbear-utils";
import type { AuraShape } from "../types/AuraShape";
import {
    buildAlternatingPreciseOctant,
    buildAlternatingSquareOctant,
} from "./alternating";
import { buildChebyshevSquarePoints } from "./chebyshev";
import { buildHexagonGridPoints } from "./hexagon";
import {
    buildManhattanPrecisePoints,
    buildManhattanSquareOctant,
} from "./manhattan";

/**
 * Create full aura points from the set of points in the first octant.
 * @param octantPoints Cell-space points in the first octant in unit space going clockwise, centered on origin.
 *                     Last point must have x=y.
 * @param absoluteItemSize Octant will place its (0,0) point at (this/2, this/2).
 * @returns Points in pixel space.
 */
function octantToPoints(
    grid: GridParsed,
    octantPoints: Vector2[],
    absoluteItemSize: Pixels,
): Vector2[] {
    if (octantPoints.length === 0) {
        throw Error("Need at least one octant point");
    }
    // if (octantPoints[octantPoints.length - 1].x !== octantPoints[octantPoints.length].y) {
    //     throw Error("Last point in octant must have x = y");
    // }
    const scaledShiftedOctant = octantPoints.map((point) =>
        Math2.add(Math2.multiply(point, grid.dpi), {
            x: absoluteItemSize / 2,
            y: absoluteItemSize / 2,
        }),
    );
    const quadrantPoints = [
        ...scaledShiftedOctant,
        ...scaledShiftedOctant
            .reverse()
            .slice(1)
            .map(({ x, y }) => ({ x: y, y: x })),
    ];
    return [
        ...quadrantPoints,
        ...quadrantPoints.map(({ x, y }) => ({ x: -y, y: x })),
        ...quadrantPoints.map(({ x, y }) => ({ x: -x, y: -y })),
        ...quadrantPoints.map(({ x, y }) => ({ x: y, y: -x })),
    ];
}

/**
 * @returns Points in pixel space centered on origin.
 */
export function getPoints(
    grid: GridParsed,
    radius: Cells,
    absoluteItemSize: Pixels,
    shape: Exclude<AuraShape, "circle">,
): Vector2[] {
    switch (shape) {
        case "square":
            return buildChebyshevSquarePoints(grid, radius, absoluteItemSize);
        case "hex": {
            // TODO normal hexagon building code, this is hacky
            const points = buildHexagonGridPoints(grid, cells(0), pixels(0));
            const cornerToCornerPx =
                2 * cellsToPixels(radius, grid) + absoluteItemSize;
            const cornerToCornerNowPx = (2 * grid.dpi) / Math.sqrt(3);
            return points.map((point) =>
                Math2.rotate(
                    Math2.multiply(
                        point,
                        cornerToCornerPx / cornerToCornerNowPx,
                    ),
                    { x: 0, y: 0 },
                    30,
                ),
            );
        }
        case "hex_hexes":
            return buildHexagonGridPoints(
                grid,
                roundCells(radius),
                absoluteItemSize,
            );
        case "manhattan":
            return buildManhattanPrecisePoints(grid, radius, absoluteItemSize);
        case "manhattan_squares":
            return octantToPoints(
                grid,
                buildManhattanSquareOctant(radius),
                absoluteItemSize,
            );
            break;
        case "alternating":
            return octantToPoints(
                grid,
                buildAlternatingPreciseOctant(radius),
                absoluteItemSize,
            );
        case "alternating_squares":
            return octantToPoints(
                grid,
                buildAlternatingSquareOctant(radius),
                absoluteItemSize,
            );
    }
}
