import { buildCurve, Curve, Vector2 } from "@owlbear-rodeo/sdk";
import { SimpleAuraDrawable } from "../types/Aura";
import { AuraShape } from "../types/AuraShape";
import { SimpleStyle } from "../types/AuraStyle";
import { GridParsed } from "../types/GridParsed";
import {
    getAxonometricTransformMatrix,
    getScale,
} from "../utils/axonometricUtils";
import { matrixMultiply } from "../utils/mathUtils";
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
    numUnits: number,
    absoluteItemSize: number,
    shape: AuraShape,
): SimpleAuraDrawable {
    let drawable: SimpleAuraDrawable;
    if (shape === "circle") {
        drawable = buildEuclideanAura(
            grid,
            position,
            numUnits,
            absoluteItemSize,
            getScale(grid.type),
        );
    } else {
        const curve = pointsToCurve(
            position,
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
