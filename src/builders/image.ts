import { buildImage, Image, Math2, Vector2 } from "@owlbear-rodeo/sdk";
import { GridParsed } from "owlbear-utils";
import { ImageBuildParams, ImageStyle } from "../types/AuraStyle";
import { getScale } from "../utils/axonometricUtils";

export function getImageAuraScale(
    imageBuildParams: ImageBuildParams,
    grid: GridParsed,
    numUnits: number,
    absoluteItemSize: number,
): Vector2 {
    const imageHeightGridUnits =
        imageBuildParams.image.height / imageBuildParams.grid.dpi;
    const auraHeightGridUnits = 2 * numUnits + absoluteItemSize / grid.dpi;
    const scalingFactor = auraHeightGridUnits / imageHeightGridUnits;
    return Math2.multiply(getScale(grid.type), scalingFactor);
}

export function buildImageAura(
    grid: GridParsed,
    style: ImageStyle,
    position: Vector2,
    numUnits: number,
    absoluteItemSize: number,
): Image {
    return buildImage(style.image, style.grid)
        .scale(getImageAuraScale(style, grid, numUnits, absoluteItemSize))
        .position(position)
        .build();
}
