import { buildImage, Image, Math2, Vector2 } from "@owlbear-rodeo/sdk";
import { ImageStyle } from "../types/AuraStyle";
import { GridParsed } from "../types/GridParsed";
import { getScale } from "../utils/axonometricUtils";

export function buildImageAura(
    grid: GridParsed,
    style: ImageStyle,
    position: Vector2,
    numUnits: number,
    absoluteItemSize: number,
): Image {
    const imageHeightGridUnits = style.image.height / style.grid.dpi;
    const auraHeightGridUnits = 2 * numUnits + absoluteItemSize / grid.dpi;
    const scalingFactor = auraHeightGridUnits / imageHeightGridUnits;
    console.log(imageHeightGridUnits, auraHeightGridUnits, scalingFactor);

    const scale = Math2.multiply(getScale(grid.type), scalingFactor);
    return buildImage(style.image, style.grid)
        .scale(scale)
        .position(position)
        .build();
}
