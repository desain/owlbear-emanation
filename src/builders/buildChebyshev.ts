import { buildCurve, Vector2 } from "@owlbear-rodeo/sdk";

export function buildChebyshevSquareAura(
    position: Vector2,
    numUnits: number,
    unitSize: number,
    absoluteItemSize: number,
) {
    const size = numUnits * unitSize + absoluteItemSize / 2;
    return buildCurve()
        .points([
            { x: -size, y: -size },
            { x: +size, y: -size },
            { x: +size, y: +size },
            { x: -size, y: +size },
        ])
        .position(position)
        .closed(true)
        .tension(0)
        .build();
}