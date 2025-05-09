import type { Effect, Vector2 } from "@owlbear-rodeo/sdk";
import { buildEffect } from "@owlbear-rodeo/sdk";
import type { GridParsed } from "owlbear-utils";
import {
    cells,
    cellsToPixels,
    getScale,
    type Cells,
    type Pixels,
} from "owlbear-utils";
import type { AuraShape } from "../types/AuraShape";
import type { EffectStyle } from "../types/AuraStyle";
import { getBlendMode } from "../types/AuraStyle";
import { declareUniforms, getUniforms } from "../utils/skslUtils";
import { getBubbleSksl } from "./bubble";
import { getRangeSksl } from "./range";
import distort from "./shaders/distort.frag";
import glow from "./shaders/glow.frag";
import { getSolidSksl } from "./solid";
import { getSpiritsSksl } from "./spirits";

function getSksl(
    grid: GridParsed,
    style: EffectStyle,
    radius: Cells,
    absoluteItemSize: Pixels,
    shape: AuraShape,
): string {
    switch (style.type) {
        case "Spirits":
            return declareUniforms(style) + getSpiritsSksl(grid, radius);
        case "Bubble":
            return (
                declareUniforms(style) +
                getBubbleSksl(grid, radius, absoluteItemSize, shape)
            );
        case "Glow":
            return declareUniforms(style) + glow;
        case "Range":
            return declareUniforms(style) + getRangeSksl(grid, shape);
        case "Solid":
            return declareUniforms(style) + getSolidSksl(grid, shape);
        case "Distort":
            return declareUniforms(style) + distort;
        case "Custom":
            return style.sksl;
    }
}

export function buildEffectAura(
    grid: GridParsed,
    style: EffectStyle,
    position: Vector2,
    radius: Cells,
    absoluteItemSize: Pixels,
    shape: AuraShape,
): Effect {
    const sksl = getSksl(grid, style, radius, absoluteItemSize, shape);
    // console.log(sksl);
    // give the effect one extra grid space for overdraw
    const extent =
        absoluteItemSize + cellsToPixels(cells(2 * (radius + 1)), grid);
    const scale = getScale(grid.type);
    const height = extent;
    const width = (extent * scale.x) / scale.y;
    return buildEffect()
        .effectType("STANDALONE")
        .blendMode(getBlendMode(style))
        .height(height)
        .width(width)
        .sksl(sksl)
        .uniforms(getUniforms(grid, style, radius, absoluteItemSize))
        .position({ x: position.x - width / 2, y: position.y - height / 2 })
        .build();
}
