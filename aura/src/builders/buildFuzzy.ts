

import { SceneMetadata } from "../types/metadata/SceneMetadata";
import { isHexGrid } from '../utils/HexGridUtils';
import { CELL_COORDS, createDistanceFunction, RANDOM } from "../utils/skslUtils";


const DISTANCE = 'distance';
const TOLERANCE = 0.01;

function anchoredAtCorner(sceneMetadata: SceneMetadata) {
    return sceneMetadata.gridType === 'SQUARE' && (
        sceneMetadata.gridMeasurement === 'ALTERNATING'
        || sceneMetadata.gridMeasurement === 'MANHATTAN'
        || sceneMetadata.gridMeasurement === 'CHEBYSHEV');
}

function getTransformCoordinateSpace(sceneMetadata: SceneMetadata) {
    if (isHexGrid(sceneMetadata.gridType) && sceneMetadata.gridMeasurement === 'CHEBYSHEV') {
        // why times sqrt3?
        // want xy / size
        // already have p = xy / width since width = dpi
        // size = width / sqrt3, width = size sqrt3
        // so p sqrt3 = sqrt3 xy / width = sqrt3 xy / size sqrt3 = xy / size

        const PI_6 = Math.PI / 6; // 30 deg
        const rotation = sceneMetadata.gridType === 'HEX_HORIZONTAL'
            ? `mat2(cos(${PI_6}), -sin(${PI_6}), sin(${PI_6}), cos(${PI_6}))`
            : 'mat2(1.0, 0.0, 0.0, 1.0)';

        return `pxtohex * ${rotation} * p * ${Math.sqrt(3)}`;
    } else if (anchoredAtCorner(sceneMetadata)) {
        return 'max(vec2(0.0), p - itemRadiusUnits)';
    } else {
        return 'p';
    }
}

function getItemRadius(sceneMetadata: SceneMetadata) {
    if (isHexGrid(sceneMetadata.gridType) && sceneMetadata.gridMeasurement === 'CHEBYSHEV') {
        // in grid mode, 
        const itemRadius = sceneMetadata.gridMode ? 'floor(itemRadiusUnits)' : 'itemRadiusUnits';
        return `${itemRadius} + ${TOLERANCE}`;
    } else if (sceneMetadata.gridMeasurement === 'EUCLIDEAN') {
        return 'itemRadiusUnits';
    } else { // anchored at corner, so item width is already subtracted away
        return String(TOLERANCE);
    }
}

function getRoundToCell(sceneMetadata: SceneMetadata) {
    if (sceneMetadata.gridMode && isHexGrid(sceneMetadata.gridType) && sceneMetadata.gridMeasurement !== 'EUCLIDEAN') {
        return 'axial_round(p)';
    } else if (sceneMetadata.gridMode && sceneMetadata.gridMeasurement !== 'EUCLIDEAN') {
        // starting from the corner, anything between 0 and 1 belongs to 1, etc
        return 'ceil(p)';
    } else {
        return 'p';
    }
}

export function getFuzzySksl(sceneMetadata: SceneMetadata): string {
    return `
// wtf is happening?
// if I don't declare this and try to call round(some_float):
// 	error: 26: no match for round(float)
// but if I declare 'round' myself:
// 	error: 12: duplicate definition of intrinsic function 'round'
// so does it exist or not??
// declare it under a different name so the compiler is happy
float round2(float x) {
  return x > 0.0 ? floor(x + 0.5) : ceil(x - 0.5);
}

const float FUZZINESS = 0.1;

// pointy top positions
// but if output is used as distance function, flat top
const mat2 pxtohex = mat2(
  // sqrt3/3
  0.577350269, 0.0,
  -0.333333333, 0.666666666
);

// https://observablehq.com/@jrus/hexround
vec2 axial_round(vec2 qr) {
    vec2 qrgrid = vec2(round2(qr.x), round2(qr.y));
    qr -= qrgrid; // remainder
    if (abs(qr.x) >= abs(qr.y)) {
        return vec2(qrgrid.x + round2(qr.x + 0.5*qr.y), qrgrid.y);
    } else {
        return vec2(qrgrid.x, qrgrid.y + round2(qr.y + 0.5*qr.x));
    }
}

${RANDOM}

${createDistanceFunction(sceneMetadata, DISTANCE)}

vec2 transformCoordinateSpace(vec2 p) {
    return ${getTransformCoordinateSpace(sceneMetadata)};
}

vec2 roundToCell(vec2 p) {
    return ${getRoundToCell(sceneMetadata)};
}

vec3 getColor(float pct) {
    return mix(vec3(1.0), color, pct);
}

vec4 main(vec2 fragCoord){
    vec2 xy = ${CELL_COORDS};
    xy += FUZZINESS * (vec2(random(xy), random(xy.yx)) - 0.5); // dither
    xy = abs(xy); // mirror to each quadrant
    xy = transformCoordinateSpace(xy); // move to corner or pixel to hex
    xy = roundToCell(xy);

    float d = ${DISTANCE}(xy);
    float itemRadius = ${getItemRadius(sceneMetadata)};
    float threshold = numUnits + itemRadius;
    float pct = ceil(d - itemRadius) / numUnits;
	float b = 1.0 - step(threshold, d);

    return vec4(getColor(pct), 1.0) * b * opacity;
}
`;
}