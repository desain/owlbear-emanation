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
import solid from "./shaders/solid.frag";

export function getSolidSksl(grid: GridParsed, shape: AuraShape): string {
    return [
        axialRound,
        createRoundToCell(shape),
        createDistanceFunction(shape),
        createAxonometricTransform(grid.type),
        createTransformCoordinateSpace(grid, shape),
        createItemRadius(shape),
        solid,
    ].join("\n");
}
