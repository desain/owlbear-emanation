#include random
#include cellCoords

// const float NUM_PARTICLES = <must be preappended in typescript>
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
    vec2 xy = cellCoords(fragCoord);
    vec4 col = vec4(0);
    for (float i = 0.0; i < NUM_PARTICLES; i++) {
        col += trail(xy, i);
    }
    return col;
}