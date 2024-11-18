import { buildCurve, Curve, Math2, Vector2 } from "@owlbear-rodeo/sdk";
import { SimpleAuraDrawable } from "../types/Aura";
import { AuraShape } from "../types/AuraShape";
import { SimpleStyle } from "../types/AuraStyle";
import { GridParsed } from "../types/GridParsed";
import {
    buildAlternatingPreciseOctant,
    buildAlternatingSquareOctant,
} from "./buildAlternating";
import { buildChebyshevSquareAura } from "./buildChebyshev";
import { buildEuclideanAura } from "./buildEuclidean";
import { buildHexagonGridAura } from "./buildHexagon";
import {
    buildManhattanPrecise,
    buildManhattanSquareOctant,
} from "./buildManhattan";

/**
 * Create a full aura curve from the set of points in the first octant.
 * @param octantPoints Points in the first octant going clockwise, centered on (0,0). Not scaled,
 *                     so one unit in octant space corresponds to one grid square. Last point must
 *                     have x=y.
 * @param scaleFactor Scaling factor between one unit in octant space and one grid unit.
 * @param absoluteItemSize Octant will place its (0,0) point at (this/2, this/2).
 * @param position Origin of the aura.
 * @returns aura shape (unstyled).
 */
function octantToCurve(
    octantPoints: Vector2[],
    scaleFactor: number,
    absoluteItemSize: number,
    position: Vector2,
): Curve {
    if (octantPoints.length === 0) {
        throw new Error("Need at least one octant point");
    }
    const scaledPoints = octantPoints.map((point) =>
        Math2.multiply(point, scaleFactor),
    );
    const shiftedOctantPoints = scaledPoints.map((point) =>
        Math2.add(point, { x: absoluteItemSize / 2, y: absoluteItemSize / 2 }),
    );
    const quadrantPoints = [
        ...shiftedOctantPoints,
        ...shiftedOctantPoints
            .reverse()
            .slice(1)
            .map(({ x, y }) => ({ x: y, y: x })),
    ];
    return buildCurve()
        .points([
            ...quadrantPoints,
            ...quadrantPoints.map(({ x, y }) => ({ x: -y, y: x })),
            ...quadrantPoints.map(({ x, y }) => ({ x: -x, y: -y })),
            ...quadrantPoints.map(({ x, y }) => ({ x: y, y: -x })),
        ])
        .position(position)
        .closed(true)
        .tension(0)
        .build();
}

function buildDrawable(
    grid: GridParsed,
    position: Vector2,
    numUnits: number,
    absoluteItemSize: number,
    shape: AuraShape,
): SimpleAuraDrawable {
    switch (shape) {
        case "square":
            return buildChebyshevSquareAura(
                position,
                numUnits,
                grid.dpi,
                absoluteItemSize,
            );
        case "hex": {
            // TODO normal hexagon building code, this is hacky
            const flatTop = grid.type === "HEX_HORIZONTAL";
            const aura = buildHexagonGridAura(
                position,
                0,
                grid.dpi,
                0,
                flatTop,
            );
            const cornerToCorner = 2 * numUnits * grid.dpi + absoluteItemSize;
            const cornerToCornerNow = (2 * grid.dpi) / Math.sqrt(3);
            aura.points = aura.points.map((point) =>
                Math2.rotate(
                    Math2.multiply(point, cornerToCorner / cornerToCornerNow),
                    { x: 0, y: 0 },
                    30,
                ),
            );
            return aura;
        }
        case "hex_hexes": {
            const flatTop = grid.type === "HEX_HORIZONTAL";
            return buildHexagonGridAura(
                position,
                Math.round(numUnits),
                grid.dpi,
                absoluteItemSize,
                flatTop,
            );
        }
        case "manhattan":
            return buildManhattanPrecise(
                position,
                numUnits,
                grid.dpi,
                absoluteItemSize,
            );
        case "manhattan_squares":
            return octantToCurve(
                buildManhattanSquareOctant(numUnits),
                grid.dpi,
                absoluteItemSize,
                position,
            );
        case "alternating":
            return octantToCurve(
                buildAlternatingPreciseOctant(numUnits),
                grid.dpi,
                absoluteItemSize,
                position,
            );
        case "alternating_squares":
            return octantToCurve(
                buildAlternatingSquareOctant(numUnits),
                grid.dpi,
                absoluteItemSize,
                position,
            );
        case "circle":
            return buildEuclideanAura(
                position,
                numUnits,
                grid.dpi,
                absoluteItemSize,
            );
    }
}

export function buildSimpleAura(
    grid: GridParsed,
    style: SimpleStyle,
    position: Vector2,
    numUnits: number,
    absoluteItemSize: number,
    shape: AuraShape,
): SimpleAuraDrawable {
    const drawable: SimpleAuraDrawable = buildDrawable(
        grid,
        position,
        numUnits,
        absoluteItemSize,
        shape,
    );
    drawable.style.fillColor = style.itemStyle.fillColor;
    drawable.style.fillOpacity = style.itemStyle.fillOpacity;
    drawable.style.strokeColor = style.itemStyle.strokeColor;
    drawable.style.strokeOpacity = style.itemStyle.strokeOpacity;
    drawable.style.strokeWidth = style.itemStyle.strokeWidth;
    drawable.style.strokeDash = style.itemStyle.strokeDash;
    return drawable;
}
