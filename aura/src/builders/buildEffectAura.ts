import { Effect, Vector2, buildEffect } from '@owlbear-rodeo/sdk';
import { EffectStyle } from '../types/AuraStyle';
import { SceneMetadata } from '../types/metadata/SceneMetadata';
import { declareUniforms, getUniforms } from '../utils/skslUtils';
import { getBubbleSksl } from "./buildBubble";
import { getFadeSksl } from "./buildFade";
import { getFuzzySksl } from "./buildFuzzy";
import { getSpiritsSksl } from "./buildSpirits";


function getSksl(sceneMetadata: SceneMetadata, style: EffectStyle, numUnits: number): string {
    switch (style.type) {
        case 'Spirits':
            return declareUniforms(style) + getSpiritsSksl(numUnits);
        case 'Bubble':
            return declareUniforms(style) + getBubbleSksl(sceneMetadata);
        case 'Fade':
            return declareUniforms(style) + getFadeSksl(sceneMetadata);
        case 'Fuzzy':
            return declareUniforms(style) + getFuzzySksl(sceneMetadata);
        default:
            const _exhaustiveCheck: never = style;
            throw new Error(`Unhandled aura type: ${_exhaustiveCheck}`);
    }
}

export function buildEffectAura(
    sceneMetadata: SceneMetadata,
    style: EffectStyle,
    position: Vector2,
    numUnits: number,
    absoluteItemSize: number,
): Effect {
    const sksl = getSksl(sceneMetadata, style, numUnits);
    // give the effect one extra grid space for overdraw
    const wh = (2 * (numUnits + 1) * sceneMetadata.gridDpi + absoluteItemSize);
    return buildEffect()
        .effectType('STANDALONE')
        .width(wh)
        .height(wh)
        .sksl(sksl)
        .uniforms(getUniforms(sceneMetadata, style, numUnits, absoluteItemSize))
        .position({ x: position.x - wh / 2, y: position.y - wh / 2 })
        .build();
}