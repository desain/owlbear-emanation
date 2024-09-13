import { GridType, Vector2 } from "@owlbear-rodeo/sdk";

export type HexGridType = 'HEX_HORIZONTAL' | 'HEX_VERTICAL';


export function isHexGrid(gridType: GridType): gridType is HexGridType {
    return gridType === 'HEX_HORIZONTAL' || gridType === 'HEX_VERTICAL';
}

export type HexGridUtils = {
    absoluteSideLength: number,
    originToClosestCenter: number,
    mainAxisSpacing: number,
    crossAxisSpacing: number,
    /**
     * Degrees to rotate a shape. 0 if pointy top, 30 if flat top
     */
    baseRotationDegrees: number,
    /**
     * Axis where hexagons touch sides
     */
    getMainAxisPosition: (point: Vector2) => number,
    /**
     * Axis along which hexes are staggered
     */
    getCrossAxisPosition: (point: Vector2) => number,
    getEmanationRadius: (numHexes: number, absoluteItemSize: number) => number,
  }
  
  
  export function getHexGridUtils(hexSize: number, gridType: HexGridType): HexGridUtils {
    const flatTop = gridType === 'HEX_HORIZONTAL';
    const absoluteSideLength = hexSize / Math.sqrt(3);
    return {
      absoluteSideLength,
      originToClosestCenter: absoluteSideLength / 2, // sin(30) * side = 1/2 * side
      mainAxisSpacing: hexSize,
      crossAxisSpacing: absoluteSideLength * 3 / 2,
      baseRotationDegrees: flatTop ? 30 : 0,
      getMainAxisPosition:  flatTop ? ((point: Vector2) => point.y) : ((point: Vector2) => point.x),
      getCrossAxisPosition: flatTop ? ((point: Vector2) => point.x) : ((point: Vector2) => point.y),
      getEmanationRadius: (numHexes: number, absoluteItemSize: number) => numHexes + Math.floor(absoluteItemSize / hexSize / 2)
    };
  }