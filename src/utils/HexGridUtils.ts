import { GridType } from "@owlbear-rodeo/sdk";

export type HexGridType = "HEX_HORIZONTAL" | "HEX_VERTICAL";

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
    gridType: HexGridType,
): HexGridUtils {
    const flatTop = gridType === "HEX_HORIZONTAL";
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
