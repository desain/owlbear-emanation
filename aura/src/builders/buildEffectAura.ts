import { Effect, Uniform, Vector2, buildEffect } from '@owlbear-rodeo/sdk';
import { SceneMetadata } from '../metadata/SceneMetadata';
import { ColorOpacityShaderStyle, EffectStyle } from '../types/AuraStyle';
import { getBubbleSksl } from "./buildBubble";
import { getFadeSksl } from "./buildFade";
import { getSpiritsSksl } from "./buildSpirits";

function getSksl(sceneMetadata: SceneMetadata, style: EffectStyle, numUnits: number): string {
    switch (style.type) {
        case 'Spirits':
            return getSpiritsSksl(numUnits);
        case 'Bubble':
            return getBubbleSksl(sceneMetadata);
        case 'Fade':
            return getFadeSksl(sceneMetadata);
        default:
            const _exhaustiveCheck: never = style;
            throw new Error(`Unhandled aura type: ${_exhaustiveCheck}`);
    }
}

function hasColorOpacityUniforms(style: EffectStyle): style is ColorOpacityShaderStyle {
    switch (style.type) {
        case 'Bubble':
        case 'Fade':
            return true;
        case 'Spirits':
            return false;
        default:
            const _exhaustiveCheck: never = style;
            throw new Error(`Unhandled aura type: ${_exhaustiveCheck}`);
    }
}

function getUniforms(sceneMetadata: SceneMetadata, style: EffectStyle): Uniform[] {
    const uniforms: Uniform[] = [
        {
            name: 'dpi',
            value: sceneMetadata.gridDpi,
        },
    ];
    if (hasColorOpacityUniforms(style)) {
        uniforms.push({
            name: 'color',
            value: style.color,
        });
        uniforms.push({
            name: 'opacity',
            value: style.opacity,
        });
    }
    return uniforms;
}

export function buildEffectAura(
    sceneMetadata: SceneMetadata,
    style: EffectStyle,
    position: Vector2,
    numUnits: number,
    absoluteItemSize: number,
): Effect {
    const sksl = getSksl(sceneMetadata, style, numUnits);
    const wh = 2 * (2 * numUnits * sceneMetadata.gridDpi + absoluteItemSize);
    return buildEffect()
        .effectType('STANDALONE')
        .width(wh)
        .height(wh)
        .sksl(sksl)
        .uniforms(getUniforms(sceneMetadata, style))
        .position({ x: position.x - wh / 2, y: position.y - wh / 2 })
        .build();
}