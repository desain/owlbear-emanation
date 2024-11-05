import OBR, { buildCurve, Curve, Math2, Vector2 } from '@owlbear-rodeo/sdk';
import { SceneMetadata } from '../metadata/SceneMetadata';
import { SimpleEmanationDrawable } from '../types/Emanation';
import { SimpleStyle } from '../types/EmanationStyle';
import { buildAlternatingPreciseOctant, buildAlternatingSquareOctant } from "./buildAlternating";
import buildChebyshevSquareEmanation from "./buildChebyshev";
import buildEuclideanEmanation from "./buildEuclidean";
import { buildHexagonGridEmanation } from "./buildHexagon";
import { buildManhattanPreciseEmanation, buildManhattanSquareOctant } from "./buildManhattan";

/**
 * Create a full emanation curve from the set of points in the first octant.
 * @param octantPoints Points in the first octant going clockwise, centered on (0,0). Not scaled,
 *                     so one unit in octant space corresponds to one grid square. Last point must
 *                     have x=y.
 * @param scaleFactor Scaling factor between one unit in octant space and one grid unit.
 * @param absoluteItemSize Octant will place its (0,0) point at (this/2, this/2).
 * @param position Origin of the emanation.
 * @returns Emanation shape (unstyled).
 */
function octantToCurve(octantPoints: Vector2[], scaleFactor: number, absoluteItemSize: number, position: Vector2): Curve {
    if (octantPoints.length === 0) {
        throw new Error("Need at least one octant point");
    }
    const scaledPoints = octantPoints.map((point) => Math2.multiply(point, scaleFactor));
    const shiftedOctantPoints = scaledPoints.map((point) => Math2.add(point, { x: absoluteItemSize / 2, y: absoluteItemSize / 2 }));
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

function buildDrawable(
    sceneMetadata: SceneMetadata,
    position: Vector2,
    numUnits: number,
    absoluteItemSize: number,
): SimpleEmanationDrawable {
    if (sceneMetadata.gridMeasurement === 'CHEBYSHEV' && sceneMetadata.gridType === 'SQUARE') {
        return buildChebyshevSquareEmanation(position, numUnits, sceneMetadata.gridDpi, absoluteItemSize);
    } else if (sceneMetadata.gridMeasurement === 'CHEBYSHEV' && (sceneMetadata.gridType === 'HEX_HORIZONTAL' || sceneMetadata.gridType === 'HEX_VERTICAL')) {
        if (sceneMetadata.gridMode) {
            return buildHexagonGridEmanation(position, Math.round(numUnits), sceneMetadata.gridDpi, absoluteItemSize, sceneMetadata.gridType);
        } else {
            // TODO normal hexagon building code, this is hacky
            const emanation = buildHexagonGridEmanation(position, 0, sceneMetadata.gridDpi, 0, sceneMetadata.gridType);
            const cornerToCorner = 2 * numUnits * sceneMetadata.gridDpi + absoluteItemSize;
            const cornerToCornerNow = 2 * sceneMetadata.gridDpi / Math.sqrt(3);
            emanation.points = emanation.points.map((point) => Math2.rotate(Math2.multiply(point, cornerToCorner / cornerToCornerNow), { x: 0, y: 0 }, 30));
            return emanation;
        }
    } else if (sceneMetadata.gridMeasurement === 'MANHATTAN') {
        if (sceneMetadata.gridMode) {
            return octantToCurve(buildManhattanSquareOctant(numUnits), sceneMetadata.gridDpi, absoluteItemSize, position);
        } else {
            return buildManhattanPreciseEmanation(position, numUnits, sceneMetadata.gridDpi, absoluteItemSize);
        }
    } else if (sceneMetadata.gridMeasurement === 'ALTERNATING') {
        const octant = sceneMetadata.gridMode
            ? buildAlternatingSquareOctant(numUnits)
            : buildAlternatingPreciseOctant(numUnits);
        return octantToCurve(octant, sceneMetadata.gridDpi, absoluteItemSize, position);
    }

    if (sceneMetadata.gridMeasurement !== 'EUCLIDEAN') {
        OBR.notification.show(
            `Emanation doesn't support measurement type ${sceneMetadata.gridMeasurement} on grid ${sceneMetadata.gridType}, defaulting to Euclidean`,
            'WARNING'
        );
    }
    return buildEuclideanEmanation(position, numUnits, sceneMetadata.gridDpi, absoluteItemSize);
}

function styleDrawable(style: SimpleStyle, emanation: SimpleEmanationDrawable) {
    emanation.style.fillColor = style.itemStyle.fillColor;
    emanation.style.fillOpacity = style.itemStyle.fillOpacity;
    emanation.style.strokeColor = style.itemStyle.strokeColor;
    emanation.style.strokeOpacity = style.itemStyle.strokeOpacity;
    emanation.style.strokeWidth = style.itemStyle.strokeWidth;
    emanation.style.strokeDash = style.itemStyle.strokeDash;
}

export default function buildSimpleEmanation(
    sceneMetadata: SceneMetadata,
    style: SimpleStyle,
    position: Vector2,
    numUnits: number,
    absoluteItemSize: number,
): SimpleEmanationDrawable {
    const drawable: SimpleEmanationDrawable = buildDrawable(sceneMetadata, position, numUnits, absoluteItemSize);
    styleDrawable(style, drawable);
    return drawable;
}