import OBR, { buildCurve, Curve, GridMeasurement, GridType, Image, Math2, Vector2 } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../constants";
import { Circle, Emanation, EmanationMetadata } from "../Emanation";
import { SceneMetadata } from "../metadata/SceneMetadata";
import { buildAlternatingPreciseOctant, buildAlternatingSquareOctant } from "./alternating";
import buildChebyshevSquareEmanation from "./chebyshev";
import buildEuclideanEmanation from "./euclidean";
import { buildHexagonGridEmanation } from "./hexagon";
import { buildManhattanPreciseEmanation, buildManhattanSquareOctant } from "./manhattan";

type Builder = (position: Vector2, numUnits: number, unitSize: number, absoluteItemSize: number) => Circle | Curve;

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

function getOctantEmanationBuilder(octantBuilder: (numUnits: number) => Vector2[]): Builder {
  return (position, numUnits, unitSize, absoluteItemSize) => {
    const octantPoints = octantBuilder(numUnits);
    return octantToEmanation(octantPoints, unitSize, absoluteItemSize / 2, position);
  }
}

function getBuilder(gridMeasurement: GridMeasurement, gridType: GridType, gridMode: boolean): Builder {
  if (gridMeasurement === 'CHEBYSHEV' && gridType === 'SQUARE') {
    return buildChebyshevSquareEmanation;
  } else if (gridMeasurement === 'CHEBYSHEV' && (gridType === 'HEX_HORIZONTAL' || gridType === 'HEX_VERTICAL')) {
    if (gridMode) {
      return (position, numUnits, unitSize, absoluteItemSize) => buildHexagonGridEmanation(position, Math.round(numUnits), unitSize, absoluteItemSize, gridType);
    } else {
      // TODO normal hexagon building code, this is hacky
      return (position, numUnits, unitSize, absoluteItemSize) => {
        const emanation = buildHexagonGridEmanation(position, 0, unitSize, 0, gridType);
        const cornerToCorner = 2 * numUnits * unitSize + absoluteItemSize;
        const cornerToCornerNow = 2 * unitSize / Math.sqrt(3);
        emanation.points = emanation.points.map((point) => Math2.rotate(Math2.multiply(point, cornerToCorner / cornerToCornerNow), { x: 0, y: 0 }, 30));
        return emanation;
      };
    }
  } else if (gridMeasurement === 'MANHATTAN') {
    if (gridMode) {
      return getOctantEmanationBuilder(buildManhattanSquareOctant);
    } else {
      return buildManhattanPreciseEmanation;
    }
  } else if (gridMeasurement === 'ALTERNATING') {
    return getOctantEmanationBuilder(gridMode ? buildAlternatingSquareOctant : buildAlternatingPreciseOctant);
  }

  if (gridMeasurement !== 'EUCLIDEAN') {
    OBR.notification.show(
      `Emanation doesn't support measurement type ${gridMeasurement} on grid ${gridType}, defaulting to Euclidean`,
      'WARNING'
    );
  }
  return buildEuclideanEmanation;
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
export default function buildEmanation(
  item: Image,
  style: Emanation['style'],
  size: number,
  { gridDpi, gridMeasurement, gridMultiplier, gridType, gridMode }: SceneMetadata,
): Emanation {

  const numUnits = size / gridMultiplier;
  const unitSize = gridDpi / item.grid.dpi;
  const absoluteItemSize = Math.max(item.image.width * item.scale.x, item.image.height * item.scale.y) * unitSize;

  const builder = getBuilder(gridMeasurement, gridType, gridMode);
  const emanation = builder(item.position, numUnits, gridDpi, absoluteItemSize);

  emanation.locked = true;
  emanation.name = `Emanation ${item.name} ${size}`;
  emanation.layer = 'PROP';
  emanation.disableHit = true;
  emanation.visible = item.visible;
  emanation.attachedTo = item.id;
  emanation.disableAttachmentBehavior = ['ROTATION', 'LOCKED'];

  emanation.style.fillColor = style.fillColor;
  emanation.style.fillOpacity = style.fillOpacity;
  emanation.style.strokeColor = style.strokeColor;
  emanation.style.strokeOpacity = style.strokeOpacity;
  emanation.style.strokeWidth = style.strokeWidth;
  emanation.style.strokeDash = style.strokeDash;

  const metadata: EmanationMetadata = { sourceScale: item.scale, size };
  emanation.metadata = { [METADATA_KEY]: metadata };
  const returnValue = emanation as typeof emanation & {
    attachedTo: string,
    metadata: { [METADATA_KEY]: EmanationMetadata },
  }; // typescript can't figure out these keys are set now
  return returnValue;
}