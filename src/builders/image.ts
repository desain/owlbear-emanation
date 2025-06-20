import type { Image, Vector2 } from "@owlbear-rodeo/sdk";
import { buildImage, Math2 } from "@owlbear-rodeo/sdk";
import type { GridParsed, ImageBuildParams } from "owlbear-utils";
import {
    getScale,
    pixels,
    pixelsToCells,
    type Cells,
    type Pixels,
} from "owlbear-utils";
import type { ImageStyle } from "../types/AuraStyle";
import { getAuraPosition } from "./buildAura";

export function getImageAuraScale(
    imageBuildParams: ImageBuildParams,
    grid: GridParsed,
    radius: Cells,
    absoluteItemSize: Pixels,
): Vector2 {
    const imageHeight = pixelsToCells(
        pixels(imageBuildParams.image.height),
        imageBuildParams.grid,
    );
    const auraHeightCells = 2 * radius + pixelsToCells(absoluteItemSize, grid);
    const scalingFactor = auraHeightCells / imageHeight;
    return Math2.multiply(getScale(grid.type), scalingFactor);
}

export function buildImageAura(
    grid: GridParsed,
    style: ImageStyle,
    position: Vector2,
    offset: Vector2 | undefined,
    radius: Cells,
    absoluteItemSize: Pixels,
): Image {
    return buildImage(style.image, style.grid)
        .scale(getImageAuraScale(style, grid, radius, absoluteItemSize))
        .position(getAuraPosition(position, offset))
        .build();
}
