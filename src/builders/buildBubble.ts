import { GridParsed } from "../types/GridParsed";
import { SceneMetadata } from "../types/metadata/SceneMetadata";
import {
    createDistanceFunction,
    createItemRadius,
    createTransformCoordinateSpace,
} from "../utils/skslUtils";
import bubble from "./shaders/bubble.frag";

export function getBubbleSksl(sceneMetadata: SceneMetadata, grid: GridParsed) {
    sceneMetadata = { ...sceneMetadata, gridMode: false }; // bubble doesn't support grid mode, pretend it's always off

    return [
        createTransformCoordinateSpace(grid),
        createDistanceFunction(sceneMetadata, grid),
        createItemRadius(sceneMetadata, grid),
        bubble,
    ].join("\n");
}
