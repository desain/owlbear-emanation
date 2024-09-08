import { GridMeasurement, Image, Item, Math2, ShapeType, Vector2, buildShape } from "@owlbear-rodeo/sdk";
import { getPluginId } from "./getPluginId";

export function isPlainObject(
  item: unknown
): item is Record<keyof any, unknown> {
  return (
    item !== null && typeof item === "object" && item.constructor === Object
  );
}

export interface EmanationMetadata extends Object {
  sourceScale: Vector2;
  size: number,
}

export function isEmanation(item: Item): boolean {
  const metadata = item.metadata[getPluginId("metadata")] as EmanationMetadata;
  return isPlainObject(metadata) && metadata.hasOwnProperty('sourceScale');
}

export function getEmanationParams(item: Image, gridDpi: number, gridMultiplier: number, measurementType: GridMeasurement, size: number) {
  const dpiScale = gridDpi / item.grid.dpi;
  const absoluteSize = size / gridMultiplier * gridDpi;
  const absoluteItemWidth = item.image.width * dpiScale * item.scale.x;
  const absoluteItemHeight = item.image.height * dpiScale * item.scale.y;


  let originOffset: Vector2;
  let shapeType: ShapeType;
  let rotation: number = 0;
  let width;
  let height;
  if (measurementType === 'EUCLIDEAN') {
    shapeType = 'CIRCLE';
    width = absoluteSize * 2 + absoluteItemWidth;
    height = absoluteSize * 2 + absoluteItemHeight;
    originOffset = { x: 0, y: 0 }; // circle origin is the center
  } else if (measurementType === 'CHEBYSHEV') {
    shapeType = 'RECTANGLE';
    width = absoluteSize * 2 + absoluteItemWidth;
    height = absoluteSize * 2 + absoluteItemHeight;
    originOffset = { x: -width / 2, y: -height / 2 }; // rectangle origin is top left
  } else if (measurementType === 'MANHATTAN') {
    shapeType = 'RECTANGLE';
    const centerToCorner = absoluteItemHeight / 2 + absoluteSize;
    const sideLength = Math2.magnitude({ x: centerToCorner, y: centerToCorner });
    width = sideLength;
    height = sideLength;
    rotation = 45;
    originOffset = { x: 0, y: -centerToCorner };
  } else {
    throw `emanation doesn't support measurement type '${measurementType}`;
  }
  // const offset = {
  //   x: (item.grid.offset.x / item.image.width) * -width,
  //   y: (item.grid.offset.y / item.image.height) * -height,
  // }
  // Apply image offset and offset circle position so the origin is the top left
  return { width, height, shapeType, rotation, position: Math2.add(item.position, originOffset) };
}