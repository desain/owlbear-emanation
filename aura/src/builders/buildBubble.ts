import { SceneMetadata } from "../metadata/SceneMetadata";
import { createSignedDistanceFunction, DECLARE_UNIFORMS, QUADRATIC_BEZIER } from '../utils/skslUtils';

const SDF = 'sdf';

export function getBubbleSksl(sceneMetadata: SceneMetadata) {
    return `
${DECLARE_UNIFORMS}
${QUADRATIC_BEZIER}

${createSignedDistanceFunction(sceneMetadata, SDF)}

float getOpacity(float d) { // opacity from distance
    return quadraticBezier(d * 2.0 + 1.0, vec2(1., .001)) * 0.95 + 0.05;
}

vec4 main(in vec2 fragCoord) {
    vec2 uv = (fragCoord / size) * 2.0 - 1.0;
    float d = ${SDF}(abs(uv));
    return vec4(color, 1.) * getOpacity(d) * opacity;
}
`;
}