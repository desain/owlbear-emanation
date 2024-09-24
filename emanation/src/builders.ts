import OBR, { buildCurve, buildShape, Curve, Image, Math2, Vector2 } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "./constants";
import { getHexGridUtils, HexGridType } from "./hexUtils";
import { SceneMetadata } from "./SceneMetadata";
import { Circle, Emanation, EmanationMetadata, EmanationStyle } from "./types";

function clockwiseAroundOrigin(point: Vector2, degrees: number) {
  return Math2.rotate(point, { x: 0, y: 0 }, degrees);
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
 * @param gridMode whether to use the square mode for the emanation. Square mode outlines the squares whose centers are included in the emanation.
 *                   Non-square mode outlines the exact shape of the emanation.
 */
export function buildEmanation(
  item: Image,
  style: EmanationStyle,
  size: number,
  { gridDpi, gridMeasurement, gridMultiplier, gridType, gridMode }: SceneMetadata,
): Emanation {
  const dpiScale = gridDpi / item.grid.dpi;
  const numUnits = size / gridMultiplier;
  const absoluteSize = numUnits * gridDpi;
  const absoluteItemSize = Math.max(item.image.width * item.scale.x, item.image.height * item.scale.y) * dpiScale;

  let emanation: Circle | Curve;
  if (gridMeasurement === 'CHEBYSHEV' && gridType === 'SQUARE') {
    emanation = buildChebyshevSquareEmanation(item.position, numUnits, gridDpi, absoluteItemSize);
  } else if (gridMeasurement === 'CHEBYSHEV' && (gridType === 'HEX_HORIZONTAL' || gridType === 'HEX_VERTICAL')) {
    if (gridMode) {
      emanation = buildHexagonGridEmanation(item.position, Math.round(numUnits), gridDpi, absoluteItemSize, gridType);
    } else {
      emanation = buildHexagonGridEmanation(item.position, 0, gridDpi, 0, gridType);
      const cornerToCorner = 2 * numUnits * gridDpi + absoluteItemSize;
      const cornerToCornerNow = 2 * gridDpi / Math.sqrt(3);
      emanation.points = emanation.points.map((point) => clockwiseAroundOrigin(Math2.multiply(point, cornerToCorner / cornerToCornerNow), 30));
    }
    if (gridType === 'HEX_HORIZONTAL') {
      emanation.rotation = 30;
    }
  } else if (gridMeasurement === 'MANHATTAN') {
    if (gridMode) {
      const octantPoints = buildManhattanSquareOctant(numUnits);
      emanation = octantToEmanation(octantPoints, gridDpi, absoluteItemSize / 2, item.position);
    } else {
      emanation = buildManhattanPreciseEmanation(item.position, absoluteSize, absoluteItemSize / 2, absoluteItemSize / 2);
    }
  } else if (gridMeasurement === 'ALTERNATING') {
    let octantPoints = gridMode
      ? buildAlternatingSquareOctant(numUnits)
      : buildAlternatingPreciseOctant(numUnits);
    emanation = octantToEmanation(octantPoints, gridDpi, absoluteItemSize / 2, item.position);
  } else {
    if (gridMeasurement !== 'EUCLIDEAN') {
      OBR.notification.show(
        `Emanation doesn't support measurement type ${gridMeasurement} on grid ${gridType}, defaulting to Euclidean`,
        'WARNING'
      );
    }
    emanation = buildCircleEmanation(item.position, absoluteSize * 2 + absoluteItemSize);
  }

  emanation.locked = true;
  emanation.name = `Emanation ${item.name} ${size}`;
  emanation.attachedTo = item.id;
  emanation.layer = 'PROP';
  emanation.disableHit = true;
  emanation.visible = item.visible;

  emanation.style.fillColor = style.fillColor;
  emanation.style.fillOpacity = style.fillOpacity;
  emanation.style.strokeColor = style.strokeColor;
  emanation.style.strokeOpacity = style.strokeOpacity;
  emanation.style.strokeWidth = style.strokeWidth;
  emanation.style.strokeDash = style.strokeDash;

  const metadata: EmanationMetadata = { sourceScale: item.scale, size };
  emanation.metadata = { [METADATA_KEY]: metadata };
  const returnValue = emanation as typeof emanation & { metadata: { [METADATA_KEY]: EmanationMetadata } }; // typescript can't figure out this key is set now
  return returnValue;
}

function buildChebyshevSquareEmanation(position: Vector2, numUnits: number, unitSize: number, absoluteItemSize: number) {
  const size = numUnits * unitSize + absoluteItemSize / 2;
  return buildCurve()
    .points([
      { x: -size, y: -size },
      { x: +size, y: -size },
      { x: +size, y: +size },
      { x: -size, y: +size },
    ])
    .position(position)
    .closed(true)
    .tension(0)
    .build();
}

/**
 * Build emanation shape for manhattan emanation in non-square mode.
 * @param position Position of center item.
 * @param absoluteSize Radius of emanation in absolute space.
 * @param halfWidth Half the width of the center item in absolute space.
 * @param halfHeight Half the height of the center item in absolute space.
 * @returns Emanation item with points in clockwise order.
 */
function buildManhattanPreciseEmanation(position: Vector2, absoluteSize: number, halfWidth: number, halfHeight: number) {
  return buildCurve()
    .points([
      { x: halfWidth + absoluteSize, y: -halfHeight }, // right top
      { x: halfWidth + absoluteSize, y: +halfHeight }, // right bottom
      { x: +halfWidth, y: halfHeight + absoluteSize }, // bottom right
      { x: -halfWidth, y: halfHeight + absoluteSize }, // bottom left
      { x: -halfWidth - absoluteSize, y: +halfHeight }, // left bottom
      { x: -halfWidth - absoluteSize, y: -halfHeight }, // left top
      { x: -halfWidth, y: -halfHeight - absoluteSize }, // top left
      { x: +halfWidth, y: -halfHeight - absoluteSize }, // top right
    ])
    .position(position)
    .closed(true)
    .tension(0)
    .build();
}

function buildHexagonGridEmanation(position: Vector2, numHexes: number, hexSize: number, absoluteItemSize: number, gridType: HexGridType) {
  const utils = getHexGridUtils(hexSize, gridType);
  const radius = utils.getEmanationRadius(numHexes, absoluteItemSize);
  const rightHexOffset = { x: utils.mainAxisSpacing, y: 0 };

  const topLeftHexOffset = clockwiseAroundOrigin(
    Math2.multiply(rightHexOffset, radius),
    240,
  );

  const pointyTopOffset = { x: 0, y: -utils.absoluteSideLength };
  const topLeftPointyTop = Math2.add(topLeftHexOffset, pointyTopOffset);
  const topLeftPointyRight = Math2.add(topLeftHexOffset, clockwiseAroundOrigin(pointyTopOffset, 60));

  const points: Vector2[] = [];
  for (let i = 0; i < radius; i++) {
    const acrossOffset = Math2.multiply(rightHexOffset, i);
    points.push(Math2.add(topLeftPointyTop, acrossOffset));
    points.push(Math2.add(topLeftPointyRight, acrossOffset));
  }
  points.push(Math2.add(topLeftPointyTop, Math2.multiply(rightHexOffset, radius)));

  return buildCurve()
    .points([
      ...points.map((point) => clockwiseAroundOrigin(point, 0)),
      ...points.map((point) => clockwiseAroundOrigin(point, 60)),
      ...points.map((point) => clockwiseAroundOrigin(point, 120)),
      ...points.map((point) => clockwiseAroundOrigin(point, 180)),
      ...points.map((point) => clockwiseAroundOrigin(point, 240)),
      ...points.map((point) => clockwiseAroundOrigin(point, 300)),
    ])
    .position(position)
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
function buildCircleEmanation(position: Vector2, diameter: number): Circle {
  return buildShape()
    .width(diameter)
    .height(diameter)
    .position(position)
    .shapeType('CIRCLE')
    .build() as Circle; // typescript doesn't know about builders
}

/**
 * Create a full emanation curve from the set of points in the first octant.
 * @param octantPoints Points in the first octant going clockwise, centered on (0,0). Not scaled,
 *                     so one unit in octant space corresponds to one grid square. Last point must
 *                     have x=y.
 * @param scaleFactor Scaling factor between one unit in octant space and one grid unit.
 * @param cornerOffset Octant will place its (0,0) point at (cornerOffset, cornerOffset).
 * @param position Origin of the emanation.
 * @returns Emanation shape (unstyled).
 */
function octantToEmanation(octantPoints: Vector2[], scaleFactor: number, cornerOffset: number, position: Vector2) {
  if (octantPoints.length === 0) {
    throw "Need at least one octant point";
  }
  const scaledPoints = octantPoints.map((point) => Math2.multiply(point, scaleFactor));
  const shiftedOctantPoints = scaledPoints.map((point) => Math2.add(point, { x: cornerOffset, y: cornerOffset }));
  const quadrantPoints = [
    ...shiftedOctantPoints,
    ...shiftedOctantPoints.reverse().slice(1).map(({ x, y }) => ({ x: y, y: x })),
  ];
  return buildCurve()
    .points([
      ...quadrantPoints,
      ...quadrantPoints.map(({ x, y }) => ({ x: -y, y: x })),
      ...quadrantPoints.map(({ x, y }) => ({ x: -x, y: -y })),
      ...quadrantPoints.map(({ x, y }) => ({ x: y, y: -x })),
    ])
    .position(position)
    .closed(true)
    .tension(0)
    .build();
}

/**
 * Build first octant of alternating emanation in square mode.
 * @param radius Number of squares to extend out.
 * @returns List of points in the first octant, centered on (0,0). Last point will have x=y.
 */
function buildAlternatingSquareOctant(radius: number) {
  const points: Vector2[] = [];
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
function buildAlternatingPreciseOctant(radius: number) {
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
function buildManhattanSquareOctant(radius: number) {
  const points: Vector2[] = [];
  let x = radius;
  let y = 0;
  let moveX = true;

  points.push({ x, y });

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