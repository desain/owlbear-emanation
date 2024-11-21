import { Image, Item, isImage } from "@owlbear-rodeo/sdk";
import { Circle, isCircle } from "./Circle";
import { GridParsed } from "./GridParsed";

export type CandidateSource = Image | Circle;
export function isCandidateSource(item: Item): item is CandidateSource {
    return isImage(item) || isCircle(item);
}

export function getAbsoluteItemSize(
    item: CandidateSource,
    grid: GridParsed,
): number {
    if (isImage(item)) {
        const gridUnitsPerItemGridUnit = grid.dpi / item.grid.dpi;
        return (
            Math.max(
                item.image.width * item.scale.x,
                item.image.height * item.scale.y,
            ) * gridUnitsPerItemGridUnit
        );
    } else {
        return item.width;
    }
}
