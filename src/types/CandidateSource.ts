import type { Image, Item } from "@owlbear-rodeo/sdk";
import { isImage } from "@owlbear-rodeo/sdk";
import type { GridParsed, Pixels } from "owlbear-utils";
import { pixels } from "owlbear-utils";
import type { Circle } from "./Circle";
import { isCircle } from "./Circle";

export type CandidateSource = Image | Circle;
export function isCandidateSource(item: Item): item is CandidateSource {
    return isImage(item) || isCircle(item);
}

export function getSourceSizePx(
    item: CandidateSource,
    grid: GridParsed,
): Pixels {
    if (isImage(item)) {
        const gridUnitsPerItemGridUnit = grid.dpi / item.grid.dpi;
        return pixels(
            Math.max(
                item.image.width * item.scale.x,
                item.image.height * item.scale.y,
            ) * gridUnitsPerItemGridUnit,
        );
    } else {
        return pixels(item.width);
    }
}
