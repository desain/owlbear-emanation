import { Effect, Vector2, buildEffect } from "@owlbear-rodeo/sdk";
import { AuraShape } from "../types/AuraShape";
import { EffectStyle } from "../types/AuraStyle";
import { GridParsed } from "../types/GridParsed";
import { getScale } from "../utils/axonometricUtils";
import { declareUniforms, getUniforms } from "../utils/skslUtils";
import { getBubbleSksl } from "./bubble";
import { getRangeSksl } from "./range";
import glow from "./shaders/glow.frag";
import { getSpiritsSksl } from "./spirits";

function getSksl(
    grid: GridParsed,
    style: EffectStyle,
    numUnits: number,
    absoluteItemSize: number,
    shape: AuraShape,
): string {
    switch (style.type) {
        case "Spirits":
            return declareUniforms(style) + getSpiritsSksl(grid, numUnits);
        case "Bubble":
            return (
                declareUniforms(style) +
                getBubbleSksl(grid, numUnits, absoluteItemSize, shape)
            );
        case "Glow":
            return declareUniforms(style) + glow;
        case "Range":
            return declareUniforms(style) + getRangeSksl(grid, shape);
    }
}

export function buildEffectAura(
    grid: GridParsed,
    style: EffectStyle,
    position: Vector2,
    numUnits: number,
    absoluteItemSize: number,
    shape: AuraShape,
): Effect {
    const sksl = getSksl(grid, style, numUnits, absoluteItemSize, shape);
    // console.log(sksl);
    // give the effect one extra grid space for overdraw
    const extent = 2 * (numUnits + 1) * grid.dpi + absoluteItemSize;
    const scale = getScale(grid.type);
    const height = extent;
    const width = (extent * scale.x) / scale.y;
    return buildEffect()
        .effectType("STANDALONE")
        .height(height)
        .width(width)
        .sksl(sksl)
        .uniforms(getUniforms(grid, style, numUnits, absoluteItemSize))
        .position({ x: position.x - width / 2, y: position.y - height / 2 })
        .build();
}
