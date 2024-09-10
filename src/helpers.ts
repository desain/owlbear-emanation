import { GridMeasurement, GridType, Image, Item, Math2, ShapeType, Vector2, buildCurve, buildShape } from "@owlbear-rodeo/sdk";
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
  color: string,
}

export function isEmanation(item: Item): boolean {
  const metadata = item.metadata[getPluginId("metadata")] as EmanationMetadata;
  return isPlainObject(metadata) && metadata.hasOwnProperty('sourceScale');
}

/**
 * Helper to build a circle shape with the proper size to match
 * the input image's size
 */
export function buildEmanation(
  item: Image,
  color: string,
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
  const metadata: EmanationMetadata = { sourceScale: item.scale, size, color };

  if (measurementType === 'CHEBYSHEV') {
    if (gridType === 'SQUARE') {
      const width = absoluteSize * 2 + absoluteItemWidth;
      const height = absoluteSize * 2 + absoluteItemHeight;
      const originOffset = { x: -width / 2, y: -height / 2 }; // rectangle origin is top left
      return buildShapeEmanation(
        absoluteSize * 2 + Math.max(absoluteItemHeight, absoluteItemWidth),
        Math2.add(item.position, originOffset),
        'RECTANGLE',
        item.id,
        metadata,
        item.visible,
      );
    }
  } else if (measurementType === 'MANHATTAN') {
    const halfWidth = absoluteItemWidth/2;
    const halfHeight = absoluteItemHeight/2;
    return buildCurve()
      .points([
        Math2.add(item.position, { x: halfWidth + absoluteSize, y: +halfHeight }), // right bottom
        Math2.add(item.position, { x: halfWidth + absoluteSize, y: -halfHeight }), // right top

        Math2.add(item.position, { x: +halfWidth, y: -halfHeight - absoluteSize }), // top right
        Math2.add(item.position, { x: -halfWidth, y: -halfHeight - absoluteSize }), // top left

        Math2.add(item.position, { x: -halfWidth - absoluteSize, y: -halfHeight }), // left top
        Math2.add(item.position, { x: -halfWidth - absoluteSize, y: +halfHeight }), // left bottom

        Math2.add(item.position, { x: -halfWidth, y: halfHeight + absoluteSize }), // bottom left
        Math2.add(item.position, { x: +halfWidth, y: halfHeight + absoluteSize }), // bottom right
      ])
      .closed(true)
      .tension(0)
      .fillOpacity(0)
      .strokeColor(metadata.color)
      .strokeOpacity(1)
      .strokeWidth(10)
      .attachedTo(item.id)
      .disableAttachmentBehavior(['SCALE'])
      .locked(true)
      .name("Emanation")
      .metadata({ [getPluginId("metadata")]: metadata })
      .layer("ATTACHMENT")
      .disableHit(true)
      .visible(item.visible)
      .build();
  } else if (measurementType === 'EUCLIDEAN') {
    return buildShapeEmanation(
      absoluteSize * 2 + Math.max(absoluteItemHeight, absoluteItemWidth),
      item.position,
      'CIRCLE',
      item.id,
      metadata,
      item.visible,
    );
  }
  console.warn(`emanation doesn't support measurement type '${measurementType} on grid ${gridType}, defaulting to Euclidean`);
  return buildShapeEmanation(
    absoluteSize * 2 + Math.max(absoluteItemHeight, absoluteItemWidth),
    item.position,
    'CIRCLE',
    item.id,
    metadata,
    item.visible,
  );
  // const offset = {
  //   x: (item.grid.offset.x / item.image.width) * -width,
  //   y: (item.grid.offset.y / item.image.height) * -height,
  // }
  // Apply image offset and offset circle position so the origin is the top left
}

function buildShapeEmanation(widthHeight: number, position: Vector2, shapeType: ShapeType, itemId: string, metadata: EmanationMetadata, visible: boolean) {
  return buildShape()
    .width(widthHeight)
    .height(widthHeight)
    .position(position)
    .fillOpacity(0)
    .strokeColor(metadata.color)
    .strokeOpacity(1)
    .strokeWidth(10)
    // .strokeDash([10, 20, 30, 40])
    .shapeType(shapeType)
    .attachedTo(itemId)
    .disableAttachmentBehavior(['SCALE'])
    .locked(true)
    .name("Emanation")
    .metadata({ [getPluginId("metadata")]: metadata })
    .layer("ATTACHMENT")
    .disableHit(true)
    .visible(visible)
    .build();
}