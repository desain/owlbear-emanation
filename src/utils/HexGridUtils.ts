import type { GridType } from "@owlbear-rodeo/sdk";
import { HexGridType } from "owlbear-utils";

export function isHexGrid(gridType: GridType): gridType is HexGridType {
    return gridType === "HEX_HORIZONTAL" || gridType === "HEX_VERTICAL";
}

export interface HexGridUtils {
    absoluteSideLength: number;
    mainAxisSpacing: number;
    crossAxisSpacing: number;
    /**
     * Degrees to rotate a shape. 0 if pointy top, 30 if flat top
     */
    baseRotationDegrees: number;
    getAuraRadius: (numHexes: number, absoluteItemSize: number) => number;
}

export function getHexGridUtils(
    hexSize: number,
    flatTop: boolean,
): HexGridUtils {
    const absoluteSideLength = hexSize / Math.sqrt(3);
    return {
        absoluteSideLength,
        mainAxisSpacing: hexSize,
        crossAxisSpacing: (absoluteSideLength * 3) / 2,
        baseRotationDegrees: flatTop ? 30 : 0,
        getAuraRadius: (numHexes: number, absoluteItemSize: number) =>
            numHexes + Math.floor(absoluteItemSize / hexSize / 2),
    };
}
