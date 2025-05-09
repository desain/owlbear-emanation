import type { Cells, GridParsed, Pixels } from "owlbear-utils";
import type { AuraShape } from "../types/AuraShape";
import {
    createAxonometricTransform,
    createSignedDistanceFunction,
} from "../utils/skslUtils";
import bubble from "./shaders/bubble.frag";

export function getBubbleSksl(
    grid: GridParsed,
    radius: Cells,
    absoluteItemSize: Pixels,
    shape: AuraShape,
) {
    return [
        createAxonometricTransform(grid.type),
        createSignedDistanceFunction(grid, radius, absoluteItemSize, shape),
        bubble,
    ].join("\n");
}
