import type { Curve, Vector2 } from "@owlbear-rodeo/sdk";
import { buildCurve } from "@owlbear-rodeo/sdk";
import type { Cells, GridParsed, Pixels } from "owlbear-utils";
import { getScale, matrixMultiply } from "owlbear-utils";
import type { SimpleAuraDrawable } from "../types/Aura";
import type { AuraShape } from "../types/AuraShape";
import type { SimpleStyle } from "../types/AuraStyle";
import { getAxonometricTransformMatrix } from "../utils/axonometricUtils";
import { getAuraPosition } from "./buildAura";
import { buildEuclideanAura } from "./euclidean";
import { getPoints } from "./points";

function pointsToCurve(position: Vector2, points: Vector2[]): Curve {
    return buildCurve()
        .points(points)
        .position(position)
        .closed(true)
        .tension(0)
        .build();
}

export function buildSimpleAura(
    grid: GridParsed,
    style: SimpleStyle,
    position: Vector2,
    offset: Vector2 | undefined,
    numUnits: Cells,
    absoluteItemSize: Pixels,
    shape: AuraShape,
): SimpleAuraDrawable {
    let drawable: SimpleAuraDrawable;
    if (shape === "circle") {
        drawable = buildEuclideanAura(
            grid,
            position,
            offset,
            numUnits,
            absoluteItemSize,
            getScale(grid.type),
        );
    } else {
        const curve = pointsToCurve(
            getAuraPosition(position, offset),
            getPoints(grid, numUnits, absoluteItemSize, shape),
        );
        const matrix = getAxonometricTransformMatrix(grid.type);
        if (matrix !== null) {
            curve.points = curve.points.map((point) =>
                matrixMultiply(matrix, point),
            );
        }
        drawable = curve;
    }
    drawable.style.fillColor = style.itemStyle.fillColor;
    drawable.style.fillOpacity = style.itemStyle.fillOpacity;
    drawable.style.strokeColor = style.itemStyle.strokeColor;
    drawable.style.strokeOpacity = style.itemStyle.strokeOpacity;
    drawable.style.strokeWidth = style.itemStyle.strokeWidth;
    drawable.style.strokeDash = style.itemStyle.strokeDash;
    return drawable;
}
