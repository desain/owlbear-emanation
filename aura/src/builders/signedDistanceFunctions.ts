import { SceneMetadata } from "../metadata/SceneMetadata";

const PARAM = 'p';

export function createSignedDistanceFunction(
    sceneMetadata: SceneMetadata,
    functionName: string,
) {
    return `
float ${functionName}(vec2 ${PARAM}) {
    ${getSignedDistanceFunction(sceneMetadata)}
}
`;
}

function getSignedDistanceFunction(sceneMetadata: SceneMetadata): string {
    if (sceneMetadata.gridMeasurement === 'CHEBYSHEV' && sceneMetadata.gridType === 'SQUARE') {
        // rectangle
        return `
            vec2 d = abs(${PARAM}) - .5;
            return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        `;
        // float roundRect(vec2 p) {
        //   vec2 rectSize = vec2(.5);
        //   float radius = 0.3 * dpi / size.x;
        //   vec2 d = abs(p) - rectSize + radius;
        //   return min(max(d.x, d.y), 0.0) + length(max(d,0.0)) - radius;
        // }
    } else if (sceneMetadata.gridMeasurement === 'MANHATTAN' && sceneMetadata.gridType === 'SQUARE') {
        // diamond
        return `return abs(${PARAM}.x) + abs(${PARAM}.y) - .5;`;
    } if (sceneMetadata.gridMeasurement === 'ALTERNATING' && sceneMetadata.gridType === 'SQUARE') {
        // octagon
        return `return max(abs(${PARAM}.x), abs(${PARAM}.y)) + min(abs(${PARAM}.x), abs(${PARAM}.y))/2 - .5;`;
    } else {
        // circle
        return `return length(${PARAM}) - .5;`;
    }
}