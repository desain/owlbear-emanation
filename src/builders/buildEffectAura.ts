import { Effect, Vector2, buildEffect } from '@owlbear-rodeo/sdk';
import { EffectStyle } from '../types/AuraStyle';
import { SceneMetadata } from '../types/metadata/SceneMetadata';
import { GridParsed } from '../ui/GridParsed';
import { declareUniforms, getUniforms } from '../utils/skslUtils';
import { getBubbleSksl } from "./buildBubble";
import { getRangeSksl } from './buildRange';
import { getSpiritsSksl } from "./buildSpirits";
import glow from "./shaders/glow.frag";


function getSksl(sceneMetadata: SceneMetadata, grid: GridParsed, style: EffectStyle, numUnits: number): string {
    switch (style.type) {
        case 'Spirits':
            return declareUniforms(style) + getSpiritsSksl(numUnits);
        case 'Bubble':
            return declareUniforms(style) + getBubbleSksl(sceneMetadata, grid);
        case 'Glow':
            return declareUniforms(style) + glow;
        case 'Range':
            return declareUniforms(style) + getRangeSksl(sceneMetadata, grid);
    }
}

export function buildEffectAura(
    sceneMetadata: SceneMetadata,
    grid: GridParsed,
    style: EffectStyle,
    position: Vector2,
    numUnits: number,
    absoluteItemSize: number,
): Effect {
    const sksl = getSksl(sceneMetadata, grid, style, numUnits);
    // console.log(sksl);
    // give the effect one extra grid space for overdraw
    const wh = (2 * (numUnits + 1) * grid.dpi + absoluteItemSize);
    return buildEffect()
        .effectType('STANDALONE')
        .width(wh)
        .height(wh)
        .sksl(sksl)
        .uniforms(getUniforms(grid, style, numUnits, absoluteItemSize))
        .position({ x: position.x - wh / 2, y: position.y - wh / 2 })
        .build();
}