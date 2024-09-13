import { Curve, GridMeasurement, GridType, Image, Item, Math2, Shape, ShapeType, Vector2, buildCurve, buildShape } from "@owlbear-rodeo/sdk";

/** Get the reverse domain name id for this plugin at a given path */
export function getPluginId(path: string) {
  return `com.desain.emanation/${path}`;
}

function isPlainObject(
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
 * Helper to build an emanation item.
 * @param item the source item that the emanation radiates from.
 * @param style the emanation style drawing params.
 * @param size the size of the emanation in grid units. E.g size=10ft on a 5-foot grid creates a 2-square emanation.
 * @param gridDpi the dpi of the grid.
 * @param gridMultiplier the multiplier for the grid size.
 * @param measurementType the type of measurement used by the current grid.
 * @param gridType the shape of the current grid.
 * @param squareMode whether to use the square mode for the emanation. Square mode outlines the squares whose centers are included in the emanation.
 *                   Non-square mode outlines the exact shape of the emanation.
 */
export function buildEmanation(
  item: Image,
  style: EmanationStyle,
  size: number,
  gridDpi: number,
  gridMultiplier: number,
  measurementType: GridMeasurement,
  gridType: GridType,
  squareMode: boolean,
): Item {
  const dpiScale = gridDpi / item.grid.dpi;
  const numSquares = size / gridMultiplier;
  const absoluteSize = numSquares * gridDpi;
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
    if (squareMode) {
      const octantPoints = buildManhattanSquareOctant(numSquares);
      emanation = octantToEmanation(octantPoints, gridDpi, Math.max(absoluteItemHeight, absoluteItemWidth) / 2, item.position);
    } else {
      emanation = buildManhattanPreciseEmanation(item.position, absoluteSize, absoluteItemWidth / 2, absoluteItemHeight / 2);
    }
  } else if (measurementType === 'ALTERNATING') {
    let octantPoints = squareMode ? buildAlternatingSquareOctant(numSquares) : buildAlternatingPreciseOctant(numSquares);
    emanation = octantToEmanation(octantPoints, gridDpi, Math.max(absoluteItemHeight, absoluteItemWidth) / 2, item.position);
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
  emanation.name = `${item.name} ${size} emanation`;
  emanation.metadata = { [getPluginId("metadata")]: metadata };
  emanation.attachedTo = item.id;
  emanation.layer = 'ATTACHMENT';
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

/**
 * Build emanation shape for manhattan emanation in non-square mode.
 * @param position Position of center item.
 * @param absoluteSize Radius of emanation in absolute space.
 * @param halfWidth Half the width of the center item in absolute space.
 * @param halfHeight Half the height of the center item in absolute space.
 * @returns Emanation item.
 */
function buildManhattanPreciseEmanation(position: Vector2, absoluteSize: number, halfWidth: number, halfHeight: number): Curve {
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

/**
 * Build basic shape.
 * @param widthHeight Width and height of shape.
 * @param position Position of shape.
 * @param shapeType Type of shape.
 * @returns Shape item.
 */
function buildShapeEmanation(widthHeight: number, position: Vector2, shapeType: ShapeType): Shape {
  return buildShape()
    .width(widthHeight)
    .height(widthHeight)
    .position(position)
    .shapeType(shapeType)
    .build();
}

/**
 * Create a full emanation curve from the set of points in the first octant.
 * @param octantPoints Points in the first octant, centered on (0,0). Not scaled, so one unit in octant space corresponds to one grid
 *                     square. Last point must have x=y.
 * @param scaleFactor Scaling factor between one unit in octant space and one grid unit.
 * @param cornerOffset Octant will place its (0,0) point at (cornerOffset, cornerOffset).
 * @param position Origin of the emanation.
 * @returns Emanation shape (unstyled).
 */
function octantToEmanation(octantPoints: Vector2[], scaleFactor: number, cornerOffset: number, position: Vector2): Curve {
  if (octantPoints.length === 0) {
    throw "Need at least one octant point";
  }
  const scaledPoints = octantPoints.map((point) => Math2.multiply(point, scaleFactor));
  const shiftedOctantPoints = scaledPoints.map((point) => Math2.add(point, { x: cornerOffset, y: cornerOffset }));
  const quadrantPoints = [
    ...shiftedOctantPoints,
    ...shiftedOctantPoints.reverse().slice(1).map(({x, y}) => ({x: y, y: x})),
  ];
  const emanationPoints = [
    ...quadrantPoints,
    ...quadrantPoints.map(({x, y}) => ({x: -y, y: x})),
    ...quadrantPoints.map(({x, y}) => ({x: -x, y: -y})),
    ...quadrantPoints.map(({x, y}) => ({x: y, y: -x})),
  ]
  const positionedEmanationPoints = emanationPoints.map((point) => Math2.add(point, position));
  return buildCurve()
    .points(positionedEmanationPoints)
    .closed(true)
    .tension(0)
    .build();
}

/**
 * Build first octant of alternating emanation in square mode.
 * @param radius Number of squares to extend out.
 * @returns List of points in the first octant, centered on (0,0). Last point will have x=y.
 */
function buildAlternatingSquareOctant(radius: number): Vector2[] {
  const points = [];
  let x = radius;
  let y = 0;
  let alternateDiagonal = true;

  while (true) {
    ++y;
    points.push({ x, y });
    if (x === y) {
      break;
    }

    if (alternateDiagonal) {
      --x;
      points.push({ x, y });
      if (x === y) {
        break;
      }
    }
    alternateDiagonal = !alternateDiagonal;
  }

  return points;
}

/**
 * Build first octant of alternating emanation in non-square mode.
 * @param radius Number of squares to extend out.
 * @returns List of points in the first octant, centered on (0,0). Last point will have x=y.
 */
function buildAlternatingPreciseOctant(radius: number): Vector2[] {
  const midpoint = radius / 1.5;
  return [
    { x: radius, y: 0 },
    { x: midpoint, y: midpoint },
  ];
}

/**
 * Build first octant of manhattan emanation in square mode.
 * @param radius Number of squares to extend out.
 * @returns List of points in the first octant, centered on (0,0). Last point will have x=y.
 */
function buildManhattanSquareOctant(radius: number): Vector2[] {
  const points = [];
  let x = radius;
  let y = 0;
  let moveX = true;

  points.push({x, y});

  while (x !== y) {
    if (moveX) {
      x--;
    } else {
      y++;
    }
    moveX = !moveX;

    points.push({ x, y });
  }

  return points;
}