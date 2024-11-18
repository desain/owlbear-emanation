import { AuraShape } from "../types/AuraShape";
import { GridParsed } from "../types/GridParsed";
import {
    createDistanceFunction,
    createItemRadius,
    createTransformCoordinateSpace,
} from "../utils/skslUtils";
import bubble from "./shaders/bubble.frag";

export function getBubbleSksl(grid: GridParsed, shape: AuraShape) {
    // bubble doesn't support concave shapes, so round them to the nearest convex shape
    if (shape === "alternating_squares") {
        shape = "alternating";
    } else if (shape === "manhattan_squares") {
        shape = "manhattan";
    } else if (shape === "hex_hexes") {
        shape = "hex";
    }

    return [
        createTransformCoordinateSpace(grid, shape),
        createDistanceFunction(shape),
        createItemRadius(shape),
        bubble,
    ].join("\n");
}
