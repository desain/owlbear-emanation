import { AuraShape } from "../types/AuraShape";
import { GridParsed } from "../types/GridParsed";
import {
    createDistanceFunction,
    createItemRadius,
    createTransformCoordinateSpace,
} from "../utils/skslUtils";
import axialRound from "./shaders/axialRound.glsl";
import range from "./shaders/range.glsl";

function createRoundToCell(shape: AuraShape) {
    let expression: string;
    if (shape === "hex_hexes") {
        expression = "axial_round(p)";
    } else if (
        shape === "square" ||
        shape === "alternating_squares" ||
        shape === "manhattan_squares"
    ) {
        // starting from the corner, anything between 0 and 1 belongs to 1, etc
        expression = "ceil(p)";
    } else {
        expression = "p";
    }
    return `vec2 roundToCell(vec2 p) {
        return ${expression};
    }`;
}

export function getRangeSksl(grid: GridParsed, shape: AuraShape): string {
    return [
        axialRound,
        createRoundToCell(shape),
        createDistanceFunction(shape),
        createTransformCoordinateSpace(grid, shape),
        createItemRadius(shape),
        range,
    ].join("\n");
}
