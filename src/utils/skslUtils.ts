import { Uniform } from '@owlbear-rodeo/sdk';
import { ColorOpacityShaderStyle, EffectStyle } from '../types/AuraStyle';
import { SceneMetadata } from "../types/metadata/SceneMetadata";
import { isHexGrid } from './HexGridUtils';

const PARAM = 'p';

export function createDistanceFunction(sceneMetadata: SceneMetadata) {
    return `float distance(vec2 ${PARAM}) {
        return (${getMeasurementExpression(sceneMetadata)});
    }`;
}

function getMeasurementExpression(sceneMetadata: SceneMetadata) {
    if (sceneMetadata.gridMeasurement === 'CHEBYSHEV' && sceneMetadata.gridType === 'SQUARE') {
        return `max(${PARAM}.x, ${PARAM}.y)`;
        // technically with SDF it should be:
        // vec2 d = ${PARAM} - radius
        // return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
    } else if (sceneMetadata.gridMeasurement === 'MANHATTAN' && sceneMetadata.gridType === 'SQUARE') {
        return `abs(${PARAM}.x) + abs(${PARAM}.y)`;
    } if (sceneMetadata.gridMeasurement === 'ALTERNATING' && sceneMetadata.gridType === 'SQUARE') {
        // sdf = octagon
        const baseDistance = `max(${PARAM}.x, ${PARAM}.y) + min(${PARAM}.x, ${PARAM}.y) / 2.0`;
        // diagonals calculate as .5 distance, so floor the distance if we only care about grid
        // cell distance
        return sceneMetadata.gridMode ? `floor(${baseDistance})` : baseDistance;
    } else if (sceneMetadata.gridMeasurement === 'CHEBYSHEV' && isHexGrid(sceneMetadata.gridType)) {
        // axial distance in hex coordinate space
        // param.x = q, param.y = r; s = -q-r
        return `(abs(${PARAM}.x) + abs(${PARAM}.x + ${PARAM}.y) + abs(${PARAM}.y)) / 2.0`;
    } else {
        // circle
        return `length(${PARAM})`;
    }
}

function hasColorOpacityUniforms(style: EffectStyle): style is ColorOpacityShaderStyle {
    switch (style.type) {
        case 'Bubble':
        case 'Glow':
        case 'Range':
            return true;
        case 'Spirits':
            return false;
    }
}

export function getUniforms(
    sceneMetadata: SceneMetadata,
    style: EffectStyle,
    numUnits: number,
    absoluteItemSize: number,
): Uniform[] {
    const uniforms: Uniform[] = [
        {
            name: 'dpi',
            value: sceneMetadata.gridDpi,
        },
        {
            name: 'numUnits',
            value: numUnits,
        },
        {
            name: 'itemRadiusUnits',
            value: 0.5 * absoluteItemSize / sceneMetadata.gridDpi,
        },
    ];
    if (hasColorOpacityUniforms(style)) {
        uniforms.push({
            name: 'color',
            value: style.color,
        });
        uniforms.push({
            name: 'opacity',
            value: style.opacity,
        });
    }
    return uniforms;
}

export function declareUniforms(style: EffectStyle) {
    let uniforms = `
        uniform vec2 size;
        uniform float dpi;
        uniform float numUnits;
        uniform float itemRadiusUnits;
        uniform float time;
    `;
    if (hasColorOpacityUniforms(style)) {
        uniforms += `
            uniform vec3 color;
            uniform float opacity;
        `;
    }
    return uniforms;
}

function anchoredAtCorner(sceneMetadata: SceneMetadata) {
    return sceneMetadata.gridType === 'SQUARE' && (
        sceneMetadata.gridMeasurement === 'ALTERNATING'
        || sceneMetadata.gridMeasurement === 'MANHATTAN'
        || sceneMetadata.gridMeasurement === 'CHEBYSHEV');
}

// sqrt3/3  -1/3
// 0        2/3
const PX_TO_HEX = `mat2(
  0.577350269, 0.0,
  -0.333333333, 0.666666666
)`;

export function createTransformCoordinateSpace(sceneMetadata: SceneMetadata) {
    let expression: string;
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

        expression = `${PX_TO_HEX} * ${rotation} * p * ${Math.sqrt(3)}`;
    } else if (anchoredAtCorner(sceneMetadata)) {
        expression = 'max(vec2(0.0), p - itemRadiusUnits)';
    } else {
        expression = 'p';
    }
    return `vec2 transformCoordinateSpace(vec2 p) {
        return ${expression};
    }`;
}

export function createItemRadius(sceneMetadata: SceneMetadata) {
    const TOLERANCE = 0.01;
    let expression: string;
    if (isHexGrid(sceneMetadata.gridType) && sceneMetadata.gridMeasurement === 'CHEBYSHEV') {
        // in grid mode, 
        const itemRadius = sceneMetadata.gridMode ? 'floor(itemRadiusUnits)' : 'itemRadiusUnits';
        expression = `${itemRadius} + ${TOLERANCE}`;
    } else if (sceneMetadata.gridMeasurement === 'EUCLIDEAN') {
        expression = 'itemRadiusUnits';
    } else { // anchored at corner, so item width is already subtracted away
        expression = String(TOLERANCE);
    }
    return `float getItemRadius() {
        return ${expression};
    }`;
}