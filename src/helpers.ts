import { Curve, GridMeasurement, GridType, Image, Item, Math2, Shape, ShapeType, Vector2, buildCurve, buildShape } from "@owlbear-rodeo/sdk";

/** Get the reverse domain name id for this plugin at a given path */
export function getPluginId(path: string) {
  return `com.desain.emanation/${path}`;
}


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
  style: EmanationStyle,
}

export function isEmanation(item: Item): boolean {
  const metadata = item.metadata[getPluginId("metadata")] as EmanationMetadata;
  return isPlainObject(metadata) && metadata.hasOwnProperty('sourceScale');
}

export interface EmanationStyle {
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeWidth: number;
  strokeDash: number[];
}

interface Emanation extends Item {
  style: EmanationStyle;
}

/**
 * Helper to build a circle shape with the proper size to match
 * the input image's size
 */
export function buildEmanation(
  item: Image,
  style: EmanationStyle,
  size: number,
  gridDpi: number,
  gridMultiplier: number,
  measurementType: GridMeasurement,
  gridType: GridType,
): Item {
  const dpiScale = gridDpi / item.grid.dpi;
  const absoluteSize = size / gridMultiplier * gridDpi;
  const absoluteItemWidth = item.image.width * dpiScale * item.scale.x;
  const absoluteItemHeight = item.image.height * dpiScale * item.scale.y;
  const metadata: EmanationMetadata = { sourceScale: item.scale, size, style };

  let emanation: Emanation;
  if (measurementType === 'CHEBYSHEV' && gridType === 'SQUARE') {
    const width = absoluteSize * 2 + absoluteItemWidth;
    const height = absoluteSize * 2 + absoluteItemHeight;
    const originOffset = { x: -width / 2, y: -height / 2 }; // rectangle origin is top left
    emanation = buildShapeEmanation(
      absoluteSize * 2 + Math.max(absoluteItemHeight, absoluteItemWidth),
      Math2.add(item.position, originOffset),
      'RECTANGLE',
    );
  } else if (measurementType === 'MANHATTAN') {
    const halfWidth = absoluteItemWidth/2;
    const halfHeight = absoluteItemHeight/2;
    emanation = buildManhattanEmanation(item.position, absoluteSize, halfWidth, halfHeight); // TODO Better shape
  } else if (measurementType === 'ALTERNATING') {
    const halfWidth = absoluteItemWidth/2;
    const halfHeight = absoluteItemHeight/2;
    emanation = buildManhattanEmanation(item.position, absoluteSize, halfWidth, halfHeight); // TODO better shape
  } else {
    if (measurementType !== 'EUCLIDEAN') {
      console.warn(`emanation doesn't support measurement type '${measurementType} on grid ${gridType}, defaulting to Euclidean`);
    }
    emanation = buildShapeEmanation(
      absoluteSize * 2 + Math.max(absoluteItemHeight, absoluteItemWidth),
      item.position,
      'CIRCLE',
    );
  }

  // const offset = {
  //   x: (item.grid.offset.x / item.image.width) * -width,
  //   y: (item.grid.offset.y / item.image.height) * -height,
  // }
  // Apply image offset and offset circle position so the origin is the top left

  emanation.locked = true;
  emanation.name = 'Emanation';
  emanation.metadata = { [getPluginId("metadata")]: metadata };
  emanation.attachedTo = item.id;
  emanation.layer = "ATTACHMENT";
  emanation.disableHit = true;
  emanation.visible = item.visible;

  emanation.style.fillColor = style.fillColor;
  emanation.style.fillOpacity = style.fillOpacity;
  emanation.style.strokeColor = style.strokeColor;
  emanation.style.strokeOpacity = style.strokeOpacity;
  emanation.style.strokeWidth = style.strokeWidth;
  emanation.style.strokeDash = style.strokeDash;

  return emanation;
}

function buildManhattanEmanation(position: Vector2, absoluteSize: number, halfWidth: number, halfHeight: number): Curve {
  return buildCurve()
    .points([
      Math2.add(position, { x: halfWidth + absoluteSize, y: +halfHeight }), // right bottom
      Math2.add(position, { x: halfWidth + absoluteSize, y: -halfHeight }), // right top

      Math2.add(position, { x: +halfWidth, y: -halfHeight - absoluteSize }), // top right
      Math2.add(position, { x: -halfWidth, y: -halfHeight - absoluteSize }), // top left

      Math2.add(position, { x: -halfWidth - absoluteSize, y: -halfHeight }), // left top
      Math2.add(position, { x: -halfWidth - absoluteSize, y: +halfHeight }), // left bottom

      Math2.add(position, { x: -halfWidth, y: halfHeight + absoluteSize }), // bottom left
      Math2.add(position, { x: +halfWidth, y: halfHeight + absoluteSize }), // bottom right
    ])
    .closed(true)
    .tension(0)
    .build();
}

function buildShapeEmanation(widthHeight: number, position: Vector2, shapeType: ShapeType): Shape {
  return buildShape()
    .width(widthHeight)
    .height(widthHeight)
    .position(position)
    .shapeType(shapeType)
    .build();
}