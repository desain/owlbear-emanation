import { Uniform } from '@owlbear-rodeo/sdk';
import { SceneMetadata } from "../metadata/SceneMetadata";
import { ColorOpacityShaderStyle, EffectStyle } from '../types/AuraStyle';

const PARAM = 'p';

export function createDistanceFunction(
    sceneMetadata: SceneMetadata,
    functionName: string,
) {
    return `
float ${functionName}(vec2 ${PARAM}) {
    return (${getMeasurementExpression(sceneMetadata)});
}
`;
}

export function createSignedDistanceFunction(
    sceneMetadata: SceneMetadata,
    functionName: string,
) {
    return `
float ${functionName}(vec2 ${PARAM}) {
    ${getSignedDistanceFunction(sceneMetadata)}
}
`;
}

function getMeasurementExpression(sceneMetadata: SceneMetadata) {
    if (sceneMetadata.gridMeasurement === 'CHEBYSHEV' && sceneMetadata.gridType === 'SQUARE') {
        // square
        return `max(${PARAM}.x, ${PARAM}.y)`;
    } else if (sceneMetadata.gridMeasurement === 'MANHATTAN' && sceneMetadata.gridType === 'SQUARE') {
        // diamond
        return `${PARAM}.x + ${PARAM}.y`;
    } if (sceneMetadata.gridMeasurement === 'ALTERNATING' && sceneMetadata.gridType === 'SQUARE') {
        // octagon
        return `max(${PARAM}.x, ${PARAM}.y) + min(${PARAM}.x, ${PARAM}.y) / 2.0`;
    } else {
        // circle
        return `length(${PARAM})`;
    }
}

function getSignedDistanceFunction(sceneMetadata: SceneMetadata): string {
    if (sceneMetadata.gridMeasurement === 'CHEBYSHEV' && sceneMetadata.gridType === 'SQUARE') {
        // rectangle
        // special case - needs custom distance function
        return `
            vec2 d = ${PARAM} - .5;
            return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        `;
        // float roundRect(vec2 p) {
        //   vec2 rectSize = vec2(.5);
        //   float radius = 0.3 * dpi / size.x;
        //   vec2 d = abs(p) - rectSize + radius;
        //   return min(max(d.x, d.y), 0.0) + length(max(d,0.0)) - radius;
        // }
    } else {
        return `return (${getMeasurementExpression(sceneMetadata)}) - 0.5;`;
    }
}

function hasColorOpacityUniforms(style: EffectStyle): style is ColorOpacityShaderStyle {
    switch (style.type) {
        case 'Bubble':
        case 'Fade':
        case 'Fuzzy':
            return true;
        case 'Spirits':
            return false;
        default:
            const _exhaustiveCheck: never = style;
            throw new Error(`Unhandled aura type: ${_exhaustiveCheck}`);
    }
}

export function getUniforms(
    sceneMetadata: SceneMetadata,
    style: EffectStyle,
    numUnits: number,
    absoluteItemSize: number,
): Uniform[] {
    const uniforms: Uniform[] = [
        {
            name: 'dpi',
            value: sceneMetadata.gridDpi,
        },
        {
            name: 'numUnits',
            value: numUnits,
        },
        {
            name: 'halfItemSizeInUnits',
            value: 0.5 * absoluteItemSize / sceneMetadata.gridDpi,
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

export const DECLARE_UNIFORMS = `
uniform vec2 size;
uniform vec3 color;
uniform float dpi;
uniform float opacity;
uniform float numUnits;
uniform float halfItemSizeInUnits;
`;

// https://thebookofshaders.com/05/
export const QUADRATIC_BEZIER = `
float quadraticBezier (float x, vec2 a){
  // adapted from BEZMATH.PS (1993)
  // by Don Lancaster, SYNERGETICS Inc.
  // http://www.tinaja.com/text/bezmath.html

  float epsilon = 0.00001;
  a.x = clamp(a.x,0.0,1.0);
  a.y = clamp(a.y,0.0,1.0);
  if (a.x == 0.5){
    a += epsilon;
  }

  // solve t from x (an inverse operation)
  float om2a = 1.0 - 2.0 * a.x;
  float t = (sqrt(a.x*a.x + om2a*x) - a.x)/om2a;
  float y = (1.0-2.0*a.y)*(t*t) + (2.0*a.y)*t;
  return y;
}
`