import { GridParsed } from "../types/GridParsed";
import { SceneMetadata } from "../types/metadata/SceneMetadata";
import { isHexGrid } from "../utils/HexGridUtils";
import {
    createDistanceFunction,
    createItemRadius,
    createTransformCoordinateSpace,
} from "../utils/skslUtils";
import axialRound from "./shaders/axialRound.glsl";
import range from "./shaders/range.glsl";

function createRoundToCell(sceneMetadata: SceneMetadata, grid: GridParsed) {
    let expression: string;
    if (
        sceneMetadata.gridMode &&
        isHexGrid(grid.type) &&
        grid.measurement !== "EUCLIDEAN"
    ) {
        expression = "axial_round(p)";
    } else if (sceneMetadata.gridMode && grid.measurement !== "EUCLIDEAN") {
        // starting from the corner, anything between 0 and 1 belongs to 1, etc
        expression = "ceil(p)";
    } else {
        expression = "p";
    }
    return `vec2 roundToCell(vec2 p) {
        return ${expression};
    }`;
}

export function getRangeSksl(
    sceneMetadata: SceneMetadata,
    grid: GridParsed,
): string {
    return [
        axialRound,
        createRoundToCell(sceneMetadata, grid),
        createDistanceFunction(sceneMetadata, grid),
        createTransformCoordinateSpace(grid),
        createItemRadius(sceneMetadata, grid),
        range,
    ].join("\n");
}
