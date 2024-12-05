import { Math2, Vector2 } from "@owlbear-rodeo/sdk";
import { AuraShape } from "../types/AuraShape";
import { GridParsed } from "../types/GridParsed";
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
 * @param octantPoints Points in the first octant in unit space going clockwise, centered on origin.
 *                     Last point must have x=y.
 * @param absoluteItemSize Octant will place its (0,0) point at (this/2, this/2).
 * @returns Points in pixel space.
 */
function octantToPoints(
    grid: GridParsed,
    octantPoints: Vector2[],
    absoluteItemSize: number,
): Vector2[] {
    if (octantPoints.length === 0) {
        throw new Error("Need at least one octant point");
    }
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
    numUnits: number,
    absoluteItemSize: number,
    shape: Exclude<AuraShape, "circle">,
): Vector2[] {
    switch (shape) {
        case "square":
            return buildChebyshevSquarePoints(grid, numUnits, absoluteItemSize);
        case "hex": {
            // TODO normal hexagon building code, this is hacky
            const points = buildHexagonGridPoints(grid, 0, 0);
            const cornerToCorner = 2 * numUnits * grid.dpi + absoluteItemSize;
            const cornerToCornerNow = (2 * grid.dpi) / Math.sqrt(3);
            return points.map((point) =>
                Math2.rotate(
                    Math2.multiply(point, cornerToCorner / cornerToCornerNow),
                    { x: 0, y: 0 },
                    30,
                ),
            );
        }
        case "hex_hexes":
            return buildHexagonGridPoints(
                grid,
                Math.round(numUnits),
                absoluteItemSize,
            );
        case "manhattan":
            return buildManhattanPrecisePoints(
                grid,
                numUnits,
                absoluteItemSize,
            );
        case "manhattan_squares":
            return octantToPoints(
                grid,
                buildManhattanSquareOctant(numUnits),
                absoluteItemSize,
            );
            break;
        case "alternating":
            return octantToPoints(
                grid,
                buildAlternatingPreciseOctant(numUnits),
                absoluteItemSize,
            );
        case "alternating_squares":
            return octantToPoints(
                grid,
                buildAlternatingSquareOctant(numUnits),
                absoluteItemSize,
            );
    }
}
