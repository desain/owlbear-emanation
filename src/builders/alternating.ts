import type { Vector2 } from "@owlbear-rodeo/sdk";
import { floorCells, type Cells } from "owlbear-utils";

/**
 * Build first octant of alternating aura in square mode.
 * @param radius Number of squares to extend out.
 * @returns List of points in the first octant, centered on (0,0). Last point will have x=y.
 */
export function buildAlternatingSquareOctant(radius: Cells) {
    const points: Vector2[] = [];
    let x = floorCells(radius);
    let y = 0;

    if (x === 0) {
        return [{ x, y }];
    }

    let alternateDiagonal = true;

    while (true) {
        ++y;
        points.push({ x, y });
        if (x === y) {
            break;
        }

        if (alternateDiagonal) {
            --x;
            points.push({ x, y });
            if (x === y) {
                break;
            }
        }
        alternateDiagonal = !alternateDiagonal;
    }

    return points;
}

/**
 * Build first octant of alternating aura in non-square mode.
 * @param radius Number of squares to extend out.
 * @returns List of points in the first octant, centered on (0,0). Last point will have x=y.
 */
export function buildAlternatingPreciseOctant(radius: Cells) {
    const midpoint = radius / 1.5;
    return [
        { x: radius, y: 0 },
        { x: midpoint, y: midpoint },
    ];
}
