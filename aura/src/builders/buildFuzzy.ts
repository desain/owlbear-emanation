

import { SceneMetadata } from "../metadata/SceneMetadata";
import { createDistanceFunction, RANDOM } from "../utils/skslUtils";

const DISTANCE = 'distance';
const TOLERANCE = 0.01;

export function getFuzzySksl(sceneMetadata: SceneMetadata): string {
    const anchoredAtCorner = sceneMetadata.gridMeasurement !== 'EUCLIDEAN';
    const moveToCorner = anchoredAtCorner
        ? 'xy -= halfItemSizeInUnits' // move to corner of item
        : '';
    const useSquares = sceneMetadata.gridMeasurement !== 'EUCLIDEAN' && sceneMetadata.gridMode;
    const gridModeAdjustment = useSquares ? 'xy = ceil(xy);' : ''; // translate coords in cell to cell number
    const stepAddition = !anchoredAtCorner
        ? 'halfItemSizeInUnits'
        : useSquares ? `0.5 + ${TOLERANCE}` : '0.0';

    return `
const float FUZZINESS = 0.5;

${RANDOM}
${createDistanceFunction(sceneMetadata, DISTANCE)}

vec4 main(vec2 fragCoord){
    vec2 xy = (fragCoord - size/2.0) / dpi; // cell coords
    xy += FUZZINESS * (vec2(random(xy), random(xy.yx)) - 0.5);
    xy = abs(xy); // mirror to each quadrant
    ${moveToCorner};
    xy = max(vec2(0.0), xy); // treat inside as on border
    ${gridModeAdjustment};

	float b = 1.0 - step(numUnits + ${stepAddition}, ${DISTANCE}(xy));

    return vec4(color, 1.0) * b * opacity;
}
`;
}