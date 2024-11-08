import { RANDOM } from '../utils/skslUtils';

export function getSpiritsSksl(numUnits: number) {
    return `
const float NUM_PARTICLES = ${6 * numUnits};
const float PI = 3.1415926535897932384626433832795;

const float glowy = 0.04;
const float baseSpeed = PI * 0.4;

// https://iquilezles.org/articles/functions/
float expImpulse( float x, float k )
{
    float h = k*x;
    return h*exp(1.0-h);
}

// https://iquilezles.org/articles/palettes/
// cosine based palette, 4 vec3 params
vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

${RANDOM}

float glow(vec2 p, vec2 c) {
    return 1.0 - smoothstep(0.0, glowy, length(p - c));
}

// speed: angular speed (radians)
vec4 trail(vec2 p, float speed, float dist, float r) {
    float rot = -speed * time + r * PI;
    p = mat2(cos(rot), -sin(rot), sin(rot), cos(rot)) * p; // rotate coordinate system
    // mod = theta of point across, 0 to 2pi
    // - PI -> theta of current point, -pi to pi
    //float myTheta = mod(atan(-p.y,-p.x),2.0*PI) - PI;

    float myTheta = mod(atan(p.y, p.x), 2.0*PI);
    float elapsedTime = myTheta / speed;

    vec2 closestCenter = vec2(cos(myTheta), sin(myTheta)) * dist;

    float fadingFactor = 1.0 - clamp(elapsedTime, 0.0, 1.0);
    fadingFactor = expImpulse(elapsedTime * 5.0, 2.0);

    float opacity = glow(p, closestCenter) * fadingFactor * 1.5;
    vec3 color = palette(
        sin(time - elapsedTime + r * 5.0),
        vec3(0.217,0.735,0.231),
        vec3(0.720,0.576,0.775),
        vec3(0.360,0.595,0.311),
        vec3(0.872,0.995,0.577)
    );
    return vec4(normalize(color) * 1.5, 1.0) * opacity;
}


vec4 main(in vec2 fragCoord) {
    vec2 xy = (fragCoord - size/2.0) / dpi; // cell coords
    //vec2 p = (2. * fragCoord.xy - size.xy) / min(size.x, size.y);

    vec4 col = vec4(0);
    for (float i = 0.0; i < NUM_PARTICLES; i++) {
        float r = random(vec2(i, 0.0));
        float r2 = random(vec2(0.0, i));
        float dist = halfItemSizeInUnits + numUnits + r * 0.7;
        float speed = baseSpeed / dist + r2;
        col += trail(xy, speed, dist, r);
    }

    return col;
}
`;
}

// OLD SLOW ONE
/*
const int TRAIL_COUNT = 30;
const int NUM_PARTICLES = ${6 * numUnits};
const float TRAIL_LENGTH = 0.5; // how long back in time

${RANDOM}

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
*/

// CIRCLE WAVES THING
/*
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

#define PI 3.1415926535897932384626433832795

// TODO another shaping fn?
float smoothinout(float x, float c, float r) {
    return smoothstep(c - r, c, x) - smoothstep(c, c + r, x);
}

float trail(vec2 uv, float speed, float radius, float size, float len) {
    float theta = PI * u_time * speed;
    float dtheta = mod(atan(uv.y,uv.x)+theta,2.0*PI);
    float gradient = clamp(1.0 - dtheta / len, 0.0, 1.0);
    float g2 = clamp(1.0 - (2.0 * PI - dtheta) / len, 0.0, 1.0);
    float dist = smoothinout(length(uv), radius, size);
    return gradient * dist + g2 * dist;
}

float head(vec2 uv, float theta, float radius, float size) {
    vec2 c = radius * vec2(cos(theta), sin(theta));
    return 1.0 - smoothstep(size, size+0.084, length(uv - c));
}

void main() {
    vec2 uv = (gl_FragCoord.xy/u_resolution.xy) * 2.0 - 1.0;
	
    float radius = 0.5;
    float size = 0.1;
    vec3 color = vec3(0);
    color += vec3(0.766,0.935,0.687) * trail(uv, -0.806, radius, size, PI * 0.5);
    color += vec3(0.935,0.380,0.282) * trail(uv, 0.648, radius, size, PI * 0.5);
    color += vec3(0.355,0.763,0.935) * trail(uv, 1.072, radius, size, PI * 0.5);
    
    gl_FragColor = vec4(color, 1.0);
}
*/