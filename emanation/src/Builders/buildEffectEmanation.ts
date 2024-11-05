import { Effect, Uniform, Vector2, buildEffect } from '@owlbear-rodeo/sdk';
import { SceneMetadata } from '../metadata/SceneMetadata';
import { EffectStyle } from '../types/EmanationStyle';

function getFadeShape(sceneMetadata: SceneMetadata) {
    if (sceneMetadata.gridMeasurement === 'EUCLIDEAN') {
        return 'circle';
    } else if (sceneMetadata.gridMeasurement === 'CHEBYSHEV' && sceneMetadata.gridType === 'SQUARE') {
        return 'rect';
    } else if (sceneMetadata.gridMeasurement === 'MANHATTAN' && sceneMetadata.gridType === 'SQUARE') {
        return 'diamond';
    } if (sceneMetadata.gridMeasurement === 'ALTERNATING' && sceneMetadata.gridType === 'SQUARE') {
        return 'alternating';
    } else {
        return 'circle';
    }
}

function getSksl(sceneMetadata: SceneMetadata, style: EffectStyle, numUnits: number): string {
    if (style.type === 'Spirits') {
        return `
uniform vec2 size;
uniform float time;
uniform float dpi;

const int TRAIL_COUNT = 30;
const int NUM_PARTICLES = ${6 * numUnits};
const float TRAIL_LENGTH = 0.5; // how long back in time

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

half3 c(float t, int particleNum) {
  float t2 = t * 2 + float(particleNum);
  return half3(sin(t2), cos(t2), sin(t2)) * .2 + .8;
}

float2 p(float t, int particleNum, float radius, float speed) {
  float t2 = t * speed + float(particleNum) / float(NUM_PARTICLES);
  return float2(sin(t2), cos(t2)) * radius;
}

half4 main(in float2 fragCoord) {
    float2 uv = (fragCoord / size) * 2.0 - 1.0;
    float unitInUv = dpi / size.x;

    half4 color = half4(0.0);

  	for (int i = 0; i < NUM_PARTICLES; i++) {
      float i_rand = random(vec2(float(i)));
      float radius = .5 + (i_rand - .5) * unitInUv * .3;
      float speed = unitInUv * (9.0 + i_rand);

      for (int j = 0; j < TRAIL_COUNT; j++) {
          float t = time - (float(j) / float(TRAIL_COUNT)) * TRAIL_LENGTH;
          float dist = length(uv - p(t, i, radius, speed)) * size.x / dpi; // dist as fraction of grid unit

          color += half4(c(t, i), 1) * exp(-dist * 10. - float(j) * 0.1);
      }
    }

    return color;
}
`;
    } else if (style.type === 'Fade') {
        return `
uniform vec2 size;
uniform vec3 color;
uniform float dpi;
uniform float opacity;

//  Function from Iñigo Quiles
//  www.iquilezles.org/www/articles/functions/functions.htm
//float pcurve( float x, float a, float b ){
//    float k = pow(a+b,a+b) / (pow(a,a)*pow(b,b));
//    return k * pow( x, a ) * pow( 1.0-x, b );
//}

// https://thebookofshaders.com/05/
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

float smoothedge(float v) {
    return quadraticBezier(v*2.+1., vec2(1., .001)) * .95 + .05;
}

float circle(vec2 p) {
  float radius = .5;
  return length(p) - radius;
}

float rect(vec2 p) {
  vec2 d = abs(p) - .5;
  return min(max(d.x, d.y), 0.0) + length(max(d,0.0));
}

// float roundRect(vec2 p) {
//   vec2 rectSize = vec2(.5);
//   float radius = 0.3 * dpi / size.x;
//   vec2 d = abs(p) - rectSize + radius;
//   return min(max(d.x, d.y), 0.0) + length(max(d,0.0)) - radius;
// }

float diamond(vec2 p) {
  return abs(p.x) + abs(p.y) - .5;
}

float alternating(vec2 p) {
  return max(abs(p.x), abs(p.y)) + min(abs(p.x), abs(p.y))/2 - .5;
}

vec4 main(in vec2 fragCoord) {
    vec2 uv = (fragCoord / size) * 2.0 - 1.0;
    float d = ${getFadeShape(sceneMetadata)}(uv);
    return vec4(color, 1.) * smoothedge(d) * opacity;
}
`;
    } else {
        throw new Error(`Unknown effect style: ${style}`);
    }
}

function getUniforms(sceneMetadata: SceneMetadata, style: EffectStyle): Uniform[] {
    const uniforms: Uniform[] = [
        {
            name: 'dpi',
            value: sceneMetadata.gridDpi,
        },
    ];
    if (style.type !== 'Spirits') {
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

export default function buildEffectEmanation(
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