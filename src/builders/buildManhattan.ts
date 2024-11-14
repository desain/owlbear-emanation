import { Vector2, buildCurve } from "@owlbear-rodeo/sdk";

/**
 * Build aura shape for manhattan aura in non-square mode.
 * @param position Position of center item.
 * @param absoluteSize Radius of aura in absolute space.
 * @param halfSize Half the width of the center item in absolute space.
 * @param halfSize Half the height of the center item in absolute space.
 * @returns aura item with points in clockwise order.
 */
export function buildManhattanPrecise(
    position: Vector2,
    numUnits: number,
    unitSize: number,
    absoluteItemSize: number,
) {
    const absoluteSize = numUnits * unitSize;
    const halfSize = absoluteItemSize / 2;
    return buildCurve()
        .points([
            { x: halfSize + absoluteSize, y: -halfSize }, // right top
            { x: halfSize + absoluteSize, y: +halfSize }, // right bottom
            { x: +halfSize, y: halfSize + absoluteSize }, // bottom right
            { x: -halfSize, y: halfSize + absoluteSize }, // bottom left
            { x: -halfSize - absoluteSize, y: +halfSize }, // left bottom
            { x: -halfSize - absoluteSize, y: -halfSize }, // left top
            { x: -halfSize, y: -halfSize - absoluteSize }, // top left
            { x: +halfSize, y: -halfSize - absoluteSize }, // top right
        ])
        .position(position)
        .closed(true)
        .tension(0)
        .build();
}

/**
 * Build first octant of manhattan aura in square mode.
 * @param radius Number of squares to extend out.
 * @returns List of points in the first octant, centered on (0,0). Last point will have x=y.
 */
export function buildManhattanSquareOctant(radius: number) {
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
