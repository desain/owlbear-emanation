import { Image, Item, Vector2, buildShape } from "@owlbear-rodeo/sdk";
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

export function getEmanationParams(item: Image, dpi: number, multiplier: number, size: number) {
  const dpiScale = dpi / item.grid.dpi;
  const width = (size / multiplier) * dpi * 2 + item.image.width * dpiScale * item.scale.x;
  const height = (size / multiplier) * dpi * 2 + item.image.height * dpiScale * item.scale.y;
  const diameter = Math.min(width, height);
  const offsetX = (item.grid.offset.x / item.image.width) * width;
  const offsetY = (item.grid.offset.y / item.image.height) * height;
  // Apply image offset and offset circle position so the origin is the top left
  const position = {
    x: item.position.x - offsetX + width / 2,
    y: item.position.y - offsetY + height / 2,
  };
  return { diameter, position };
}

/**
 * Helper to build a circle shape with the proper size to match
 * the input image's size
 */
export function buildEmanation(
  item: Image,
  color: string,
  dpi: number,
  multiplier: number,
  size: number,
) {
  const { diameter, position } = getEmanationParams(item, dpi, multiplier, size);
  const metadata: EmanationMetadata = { sourceScale: item.scale, size };

  const circle = buildShape()
    .width(diameter)
    .height(diameter)
    .position(position)
    .fillOpacity(0)
    .strokeColor(color)
    .strokeOpacity(1)
    .strokeWidth(10)
    // .strokeDash([10, 20, 30, 40])
    .shapeType("CIRCLE")
    .attachedTo(item.id)
    .disableAttachmentBehavior(['SCALE'])
    .locked(true)
    .name("Emanation")
    .metadata({ [getPluginId("metadata")]: metadata })
    .layer("ATTACHMENT")
    .disableHit(true)
    .visible(item.visible)
    .build();

  return circle;
}
