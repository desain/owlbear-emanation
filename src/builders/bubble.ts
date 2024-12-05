import { AuraShape } from "../types/AuraShape";
import { GridParsed } from "../types/GridParsed";
import {
    createAxonometricTransform,
    createSignedDistanceFunction,
} from "../utils/skslUtils";
import bubble from "./shaders/bubble.frag";

export function getBubbleSksl(
    grid: GridParsed,
    numUnits: number,
    absoluteItemSize: number,
    shape: AuraShape,
) {
    return [
        createAxonometricTransform(grid.type),
        createSignedDistanceFunction(grid, numUnits, absoluteItemSize, shape),
        bubble,
    ].join("\n");
}
