import type { Effect, Layer, Vector2 } from "@owlbear-rodeo/sdk";
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
import { getAuraPosition } from "./buildAura";
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
    layer: Layer,
): string {
    switch (style.type) {
        case "Spirits":
            return declareUniforms(style, layer) + getSpiritsSksl(grid, radius);
        case "Bubble":
            return (
                declareUniforms(style, layer) +
                getBubbleSksl(grid, radius, absoluteItemSize, shape)
            );
        case "Glow":
            return declareUniforms(style, layer) + glow;
        case "Range":
            return declareUniforms(style, layer) + getRangeSksl(grid, shape);
        case "Solid":
            return declareUniforms(style, layer) + getSolidSksl(grid, shape);
        case "Distort":
            return declareUniforms(style, layer) + distort;
        case "Custom":
            return style.sksl;
    }
}

export function buildEffectAura(
    grid: GridParsed,
    style: EffectStyle,
    position: Vector2,
    offset: Vector2 | undefined,
    radius: Cells,
    absoluteItemSize: Pixels,
    shape: AuraShape,
    layer: Layer,
): Effect {
    const sksl = getSksl(grid, style, radius, absoluteItemSize, shape, layer);
    // console.log(sksl);
    // give the effect one extra grid space for overdraw
    const extent =
        absoluteItemSize + cellsToPixels(cells(2 * (radius + 1)), grid);
    const scale = getScale(grid.type);
    const height = extent;
    const width = (extent * scale.x) / scale.y;
    const squareOffset = { x: -width / 2, y: -height / 2 };
    return buildEffect()
        .effectType("STANDALONE")
        .blendMode(getBlendMode(style))
        .height(height)
        .width(width)
        .sksl(sksl)
        .uniforms(getUniforms(grid, style, radius, absoluteItemSize))
        .position(getAuraPosition(position, offset, squareOffset))
        .build();
}
