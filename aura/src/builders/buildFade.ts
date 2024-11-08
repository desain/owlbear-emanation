import { SceneMetadata } from "../metadata/SceneMetadata";
import { createSignedDistanceFunction } from "./signedDistanceFunctions";

const SDF = 'sdf';

export function getFadeSksl(sceneMetadata: SceneMetadata) {
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

float getOpacity(float d) {
    return 1 - quadraticBezier(d*2.+1., vec2(0.5, 0.0));
}

${createSignedDistanceFunction(sceneMetadata, SDF)}

vec4 main(in vec2 fragCoord) {
    vec2 uv = (fragCoord / size) * 2.0 - 1.0;
    float d = ${SDF}(abs(uv));
    return vec4(color, 1.) * getOpacity(d) * opacity;
}
`;
}