

import { SceneMetadata } from "../types/metadata/SceneMetadata";
import { isHexGrid } from '../utils/HexGridUtils';
import { createDistanceFunction, createItemRadius, createTransformCoordinateSpace } from "../utils/skslUtils";
import axialRound from "./shaders/axialRound.glsl";
import range from "./shaders/range.glsl";


function createRoundToCell(sceneMetadata: SceneMetadata) {
    let expression: string;
    if (sceneMetadata.gridMode && isHexGrid(sceneMetadata.gridType) && sceneMetadata.gridMeasurement !== 'EUCLIDEAN') {
        expression = 'axial_round(p)';
    } else if (sceneMetadata.gridMode && sceneMetadata.gridMeasurement !== 'EUCLIDEAN') {
        // starting from the corner, anything between 0 and 1 belongs to 1, etc
        expression = 'ceil(p)';
    } else {
        expression = 'p';
    }
    return `vec2 roundToCell(vec2 p) {
        return ${expression};
    }`;
}

export function getRangeSksl(sceneMetadata: SceneMetadata): string {
    return [
        axialRound,
        createRoundToCell(sceneMetadata),
        createDistanceFunction(sceneMetadata),
        createTransformCoordinateSpace(sceneMetadata),
        createItemRadius(sceneMetadata),
        range,
    ].join('\n');
}