import spirits from "./shaders/spirits.frag";

export function getSpiritsSksl(numUnits: number) {
    const numParticles = 3 + 3 * numUnits;
    return `const float NUM_PARTICLES = ${numParticles};` + spirits;
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