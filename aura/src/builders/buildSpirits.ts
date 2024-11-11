import { RANDOM } from '../utils/skslUtils';

export function getSpiritsSksl(numUnits: number) {
    let numParticles = 3 + 3 * numUnits;
    return `
const float NUM_PARTICLES = ${numParticles};
const float RADIAL_JITTER = 0.5;
const float PI = 3.1415926535897932384626433832795;
const float SPEED_JITTER = PI * 0.4;
const float GLOW_RADIUS = 0.23;
const float BASE_SPEED = PI * 0.8;
const float COLOR_JITTER = 5.0;

// https://iquilezles.org/articles/palettes/
// cosine based palette, 4 vec3 params
vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

${RANDOM}

float glow(vec2 p, vec2 c) {
    return 1.0 - smoothstep(0.0, GLOW_RADIUS, length(p - c));
}

// speed: angular speed (radians)
vec4 trail(vec2 p, float i) {
    float r1 = random(vec2(i, 0.0));
    float r2 = random(vec2(i, 1.0));
    float r3 = random(vec2(i, 2.0));
    float r4 = random(vec2(i, 3.0));

    float dist = itemRadiusUnits + numUnits + r1 * RADIAL_JITTER;
    float speed = BASE_SPEED / dist + r2 * SPEED_JITTER;
    float rot = -speed * time + r3 * PI;
    p = mat2(cos(rot), -sin(rot), sin(rot), cos(rot)) * p; // rotate coordinate system

    // mod(theta, 2pi) gives it in full circle coords
    float theta = atan(p.y, p.x);

    float elapsedTime = theta / speed;
    vec3 color = palette(
        time - elapsedTime + r4 * COLOR_JITTER,
        vec3(0.8, 0.8, 0.8),
        vec3(0.2, 0.2, 0.2),
        vec3(.5),
        vec3(0.6,0.0,0.4)
    );

    float opacity = 0.0;
    if (theta > 0.0) {
        vec2 closestCenter = vec2(cos(theta), sin(theta)) * dist;
        opacity = glow(p, closestCenter) * max(0.0, 1.0 - elapsedTime);
    } else {
        opacity = glow(p, vec2(dist, 0.0));
    }

    return vec4(clamp(color, 0.0, 1.0), 1.0) * 2.0 * opacity;
}


vec4 main(in vec2 fragCoord) {
    vec2 xy = (fragCoord - size/2.0) / dpi; // cell coords
    //vec2 p = (2. * fragCoord.xy - size.xy) / min(size.x, size.y);

    vec4 col = vec4(0);
    for (float i = 0.0; i < NUM_PARTICLES; i++) {
        col += trail(xy, i);
    }

    return col;
}
`;
}

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