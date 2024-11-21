import { Effect, Vector2, buildEffect } from "@owlbear-rodeo/sdk";
import { AuraShape } from "../types/AuraShape";
import { EffectStyle } from "../types/AuraStyle";
import { GridParsed } from "../types/GridParsed";
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
            return declareUniforms(style) + getSpiritsSksl(numUnits);
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
    const wh = 2 * (numUnits + 1) * grid.dpi + absoluteItemSize;
    return buildEffect()
        .effectType("STANDALONE")
        .width(wh)
        .height(wh)
        .sksl(sksl)
        .uniforms(getUniforms(grid, style, numUnits, absoluteItemSize))
        .position({ x: position.x - wh / 2, y: position.y - wh / 2 })
        .build();
}
