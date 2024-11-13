import { Uniform } from '@owlbear-rodeo/sdk';
import { ColorOpacityShaderStyle, EffectStyle } from '../types/AuraStyle';
import { SceneMetadata } from "../types/metadata/SceneMetadata";
import { GridParsed } from '../ui/GridParsed';
import { isHexGrid } from './HexGridUtils';

const PARAM = 'p';

export function createDistanceFunction(sceneMetadata: SceneMetadata, grid: GridParsed) {
    return `float distance(vec2 ${PARAM}) {
        return (${getMeasurementExpression(sceneMetadata, grid)});
    }`;
}

function getMeasurementExpression(sceneMetadata: SceneMetadata, grid: GridParsed) {
    if (grid.measurement === 'CHEBYSHEV' && grid.type === 'SQUARE') {
        return `max(${PARAM}.x, ${PARAM}.y)`;
        // technically with SDF it should be:
        // vec2 d = ${PARAM} - radius
        // return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
    } else if (grid.measurement === 'MANHATTAN' && grid.type === 'SQUARE') {
        return `abs(${PARAM}.x) + abs(${PARAM}.y)`;
    } if (grid.measurement === 'ALTERNATING' && grid.type === 'SQUARE') {
        // sdf = octagon
        const baseDistance = `max(${PARAM}.x, ${PARAM}.y) + min(${PARAM}.x, ${PARAM}.y) / 2.0`;
        // diagonals calculate as .5 distance, so floor the distance if we only care about grid
        // cell distance
        return sceneMetadata.gridMode ? `floor(${baseDistance})` : baseDistance;
    } else if (grid.measurement === 'CHEBYSHEV' && isHexGrid(grid.type)) {
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
    grid: GridParsed,
    style: EffectStyle,
    numUnits: number,
    absoluteItemSize: number,
): Uniform[] {
    const uniforms: Uniform[] = [
        {
            name: 'dpi',
            value: grid.dpi,
        },
        {
            name: 'numUnits',
            value: numUnits,
        },
        {
            name: 'itemRadiusUnits',
            value: 0.5 * absoluteItemSize / grid.dpi,
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

function anchoredAtCorner(grid: GridParsed) {
    return grid.type === 'SQUARE' && (
        grid.measurement === 'ALTERNATING'
        || grid.measurement === 'MANHATTAN'
        || grid.measurement === 'CHEBYSHEV');
}

// sqrt3/3  -1/3
// 0        2/3
const PX_TO_HEX = `mat2(
  0.577350269, 0.0,
  -0.333333333, 0.666666666
)`;

export function createTransformCoordinateSpace(grid: GridParsed) {
    let expression: string;
    if (isHexGrid(grid.type) && grid.measurement === 'CHEBYSHEV') {
        // why times sqrt3?
        // want xy / size
        // already have p = xy / width since width = dpi
        // size = width / sqrt3, width = size sqrt3
        // so p sqrt3 = sqrt3 xy / width = sqrt3 xy / size sqrt3 = xy / size

        const PI_6 = Math.PI / 6; // 30 deg
        const rotation = grid.type === 'HEX_HORIZONTAL'
            ? `mat2(cos(${PI_6}), -sin(${PI_6}), sin(${PI_6}), cos(${PI_6}))`
            : 'mat2(1.0, 0.0, 0.0, 1.0)';

        expression = `${PX_TO_HEX} * ${rotation} * p * ${Math.sqrt(3)}`;
    } else if (anchoredAtCorner(grid)) {
        expression = 'max(vec2(0.0), p - itemRadiusUnits)';
    } else {
        expression = 'p';
    }
    return `vec2 transformCoordinateSpace(vec2 p) {
        return ${expression};
    }`;
}

export function createItemRadius(sceneMetadata: SceneMetadata, grid: GridParsed) {
    const TOLERANCE = 0.01;
    let expression: string;
    if (isHexGrid(grid.type) && grid.measurement === 'CHEBYSHEV') {
        // in grid mode, 
        const itemRadius = sceneMetadata.gridMode ? 'floor(itemRadiusUnits)' : 'itemRadiusUnits';
        expression = `${itemRadius} + ${TOLERANCE}`;
    } else if (grid.measurement === 'EUCLIDEAN') {
        expression = 'itemRadiusUnits';
    } else { // anchored at corner, so item width is already subtracted away
        expression = String(TOLERANCE);
    }
    return `float getItemRadius() {
        return ${expression};
    }`;
}