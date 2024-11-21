import { buildCurve, Curve, Vector2 } from "@owlbear-rodeo/sdk";
import { SimpleAuraDrawable } from "../types/Aura";
import { AuraShape } from "../types/AuraShape";
import { SimpleStyle } from "../types/AuraStyle";
import { GridParsed } from "../types/GridParsed";
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
    const drawable: SimpleAuraDrawable =
        shape === "circle"
            ? buildEuclideanAura(position, numUnits, grid.dpi, absoluteItemSize)
            : pointsToCurve(
                  position,
                  getPoints(grid, numUnits, absoluteItemSize, shape),
              );
    drawable.style.fillColor = style.itemStyle.fillColor;
    drawable.style.fillOpacity = style.itemStyle.fillOpacity;
    drawable.style.strokeColor = style.itemStyle.strokeColor;
    drawable.style.strokeOpacity = style.itemStyle.strokeOpacity;
    drawable.style.strokeWidth = style.itemStyle.strokeWidth;
    drawable.style.strokeDash = style.itemStyle.strokeDash;
    return drawable;
}
