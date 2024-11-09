import { Uniform } from '@owlbear-rodeo/sdk';
import { ColorOpacityShaderStyle, EffectStyle } from '../types/AuraStyle';
import { SceneMetadata } from "../types/metadata/SceneMetadata";

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

function getMeasurementExpression(sceneMetadata: SceneMetadata) {
    if (sceneMetadata.gridMeasurement === 'CHEBYSHEV' && sceneMetadata.gridType === 'SQUARE') {
        // square
        return `max(${PARAM}.x, ${PARAM}.y)`;
        // technically with SDF it should be:
        // vec2 d = ${PARAM} - radius
        // return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
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

function hasColorOpacityUniforms(style: EffectStyle): style is ColorOpacityShaderStyle {
    switch (style.type) {
        case 'Bubble':
        case 'Glow':
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

export function declareUniforms(style: EffectStyle) {
    let uniforms = `
        uniform vec2 size;
        uniform float dpi;
        uniform float numUnits;
        uniform float halfItemSizeInUnits;
        uniform float time;
    `;
    if (hasColorOpacityUniforms(style)) {
        uniforms += `
            uniform vec3 color;
            uniform float opacity;
        `;
    }
    return uniforms;
}

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
`;

// https://thebookofshaders.com/10/
// outputs 0 to 1
export const RANDOM = `
float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}
`