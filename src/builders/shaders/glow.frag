#include cellCoords
#include quadraticBezier

vec4 main(in vec2 fragCoord) {
    vec2 xy = cellCoords(fragCoord); // cell coords
    float radius = numUnits + itemRadiusUnits;
    float pct = length(xy) / radius;
    float o = 1.0 - quadraticBezier(pct, vec2(0.99, 0.99));
    vec3 c = mix(vec3(1.0), color, quadraticBezier(pct, vec2(0.2, 0.7)));
    return vec4(c, 1.0) * o * opacity;
}