import { SceneMetadata } from "../types/metadata/SceneMetadata";
import { createDistanceFunction, QUADRATIC_BEZIER } from "../utils/skslUtils";

const DISTANCE = 'distance';

export function getFadeSksl(sceneMetadata: SceneMetadata) {
    const anchoredAtCorner = sceneMetadata.gridMeasurement !== 'EUCLIDEAN';
    const moveToCorner = anchoredAtCorner
        ? 'xy -= halfItemSizeInUnits' // move to corner of item
        : '';
    const distanceAdjustment = anchoredAtCorner ? '0.0' : 'halfItemSizeInUnits';

    return `
${QUADRATIC_BEZIER}

${createDistanceFunction(sceneMetadata, DISTANCE)}

float getOpacity(float d) { // opacity from distance
    return 1 - quadraticBezier(d * 2.0 + 1.0, vec2(0.99, 0.99));
}

vec4 main(in vec2 fragCoord) {
    vec2 xy = (fragCoord - size/2.0) / dpi; // cell coords
    xy = abs(xy); // mirror to each quadrant
    ${moveToCorner};
    xy = max(vec2(0.0), xy); // treat inside as on border
    float d = (${DISTANCE}(xy) - numUnits - ${distanceAdjustment}) / (2.0 * numUnits);
    return vec4(color, 1.) * getOpacity(d) * opacity;
}
`;
}