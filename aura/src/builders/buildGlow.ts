import { CELL_COORDS, QUADRATIC_BEZIER } from "../utils/skslUtils";

/**
 * @returns Shader for always-circular glow around token.
 */
export function getGlowSksl() {
    return `
${QUADRATIC_BEZIER}

float getOpacity(float pct) { // opacity from distance
    return 1 - quadraticBezier(pct, vec2(0.99, 0.99));
}

vec3 getColor(float pct) {
    return mix(vec3(1.0), color, quadraticBezier(pct, vec2(0.2, 0.7)));
}

vec4 main(in vec2 fragCoord) {
    vec2 xy = ${CELL_COORDS}; // cell coords
    float radius = numUnits + halfItemSizeInUnits;
    float pct = length(xy) / radius;
    return vec4(getColor(pct), 1.) * getOpacity(pct) * opacity;
}
`;
}