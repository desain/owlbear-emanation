import type { GridParsed } from "owlbear-utils";
import type { AuraShape } from "../types/AuraShape";
import {
    createAxonometricTransform,
    createDistanceFunction,
    createItemRadius,
    createRoundToCell,
    createTransformCoordinateSpace,
} from "../utils/skslUtils";
import axialRound from "./shaders/axialRound.glsl";
import range from "./shaders/range.frag";

export function getRangeSksl(grid: GridParsed, shape: AuraShape): string {
    return [
        axialRound,
        createRoundToCell(shape),
        createDistanceFunction(shape),
        createAxonometricTransform(grid.type),
        createTransformCoordinateSpace(grid, shape),
        createItemRadius(shape),
        range,
    ].join("\n");
}
