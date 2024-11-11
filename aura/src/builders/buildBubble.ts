import { SceneMetadata } from "../types/metadata/SceneMetadata";
import { createDistanceFunction, createItemRadius, createTransformCoordinateSpace } from '../utils/skslUtils';
import bubble from "./shaders/bubble.frag";

export function getBubbleSksl(sceneMetadata: SceneMetadata) {
    sceneMetadata = { ...sceneMetadata, gridMode: false }; // bubble doesn't support grid mode, pretend it's always off

    return [
        createTransformCoordinateSpace(sceneMetadata),
        createDistanceFunction(sceneMetadata),
        createItemRadius(sceneMetadata),
        bubble,
    ].join('\n');
}