import { Uniform, Vector2 } from "@owlbear-rodeo/sdk";
import { getPoints } from "../builders/points";
import { AuraShape } from "../types/AuraShape";
import { ColorOpacityShaderStyle, EffectStyle } from "../types/AuraStyle";
import { GridParsed } from "../types/GridParsed";

const PARAM = "p";
const PI_6 = Math.PI / 6; // 30 deg
const SQRT_3 = Math.sqrt(3);

export function createSignedDistanceFunction(
    grid: GridParsed,
    numUnits: number,
    absoluteItemSize: number,
    shape: AuraShape,
) {
    if (shape === "circle") {
        const radius = numUnits * grid.dpi + absoluteItemSize / 2;
        return `
            float distance(in vec2 ${PARAM}) {
                return (${getMeasurementExpression(shape)}) - ${radius};
            }`;
    } else {
        const points = getPoints(grid, numUnits, absoluteItemSize, shape);
        return createPolygonSignedDistanceFunction(points);
    }
}

export function createDistanceFunction(shape: AuraShape) {
    return `float distance(in vec2 ${PARAM}) {
        return (${getMeasurementExpression(shape)});
    }`;
}

function getMeasurementExpression(shape: AuraShape) {
    if (shape === "square") {
        return `max(${PARAM}.x, ${PARAM}.y)`;
        // technically with SDF it should be:
        // vec2 d = ${PARAM} - radius
        // return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
    } else if (shape === "manhattan" || shape === "manhattan_squares") {
        return `abs(${PARAM}.x) + abs(${PARAM}.y)`;
    } else if (shape === "alternating" || shape === "alternating_squares") {
        // sdf = octagon
        const baseDistance = `max(${PARAM}.x, ${PARAM}.y) + min(${PARAM}.x, ${PARAM}.y) / 2.0`;
        // diagonals calculate as .5 distance, so floor the distance if we only care about grid
        // cell distance
        return shape === "alternating_squares"
            ? `floor(${baseDistance})`
            : baseDistance;
    } else if (shape === "hex" || shape === "hex_hexes") {
        // axial distance in hex coordinate space
        // param.x = q, param.y = r; s = -q-r
        return `(abs(${PARAM}.x) + abs(${PARAM}.x + ${PARAM}.y) + abs(${PARAM}.y)) / 2.0`;
    } else {
        // circle
        return `length(${PARAM})`;
    }
}

function hasColorOpacityUniforms(
    style: EffectStyle,
): style is ColorOpacityShaderStyle {
    switch (style.type) {
        case "Bubble":
        case "Glow":
        case "Range":
            return true;
        case "Spirits":
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
            name: "dpi",
            value: grid.dpi,
        },
        {
            name: "numUnits",
            value: numUnits,
        },
        {
            name: "itemRadiusUnits",
            value: (0.5 * absoluteItemSize) / grid.dpi,
        },
    ];
    if (hasColorOpacityUniforms(style)) {
        uniforms.push({
            name: "color",
            value: style.color,
        });
        uniforms.push({
            name: "opacity",
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

function anchoredAtCorner(shape: AuraShape) {
    return (
        shape === "square" ||
        shape === "alternating" ||
        shape === "alternating_squares" ||
        shape === "manhattan" ||
        shape === "manhattan_squares"
    );
}

// sqrt3/3  -1/3
// 0        2/3
const PX_TO_HEX = `mat2(
  0.577350269, 0.0,
  -0.333333333, 0.666666666
)`;

export function createTransformCoordinateSpace(
    grid: GridParsed,
    shape: AuraShape,
) {
    let expression: string;
    if (shape === "hex" || shape === "hex_hexes") {
        // why times sqrt3?
        // want xy / size
        // already have p = xy / width since width = dpi
        // size = width / sqrt3, width = size sqrt3
        // so p sqrt3 = sqrt3 xy / width = sqrt3 xy / size sqrt3 = xy / size

        const rotation =
            grid.type === "HEX_HORIZONTAL"
                ? `mat2(cos(${PI_6}), -sin(${PI_6}), sin(${PI_6}), cos(${PI_6}))`
                : "mat2(1.0, 0.0, 0.0, 1.0)";

        expression = `${PX_TO_HEX} * ${rotation} * p * ${SQRT_3}`;
    } else if (anchoredAtCorner(shape)) {
        expression = "max(vec2(0.0), p - itemRadiusUnits)";
    } else {
        expression = "p";
    }
    return `vec2 transformCoordinateSpace(vec2 p) {
        return ${expression};
    }`;
}

export function createItemRadius(shape: AuraShape) {
    const TOLERANCE = 0.01;
    let expression: string;
    if (shape === "hex" || shape === "hex_hexes") {
        // in grid mode,
        const itemRadius =
            shape === "hex_hexes"
                ? "floor(itemRadiusUnits)"
                : "itemRadiusUnits";
        expression = `${itemRadius} + ${TOLERANCE}`;
    } else if (shape === "circle") {
        expression = "itemRadiusUnits";
    } else {
        // anchored at corner, so item width is already subtracted away
        expression = String(TOLERANCE);
    }
    return `float getItemRadius() {
        return ${expression};
    }`;
}

/**
 * https://iquilezles.org/articles/distfunctions2d/ - polygon
 * TODO: take advantage of symmetry by only getting points in one octant or quadrant.
 * @param points Points in uv space (-1 to 1 across)
 * @returns
 */
function createPolygonSignedDistanceFunction(points: Vector2[]) {
    let sksl = "";

    function pointName(idx: number) {
        return `p${idx}`;
    }

    points.forEach(({ x, y }, idx) => {
        sksl += `const vec2 ${pointName(idx)} = vec2(${x}, ${y});\n`;
    });

    sksl += `
float distance(in vec2 p)
{
    float d = dot(p-${pointName(0)},p-${pointName(0)});
    float s = 1.0;

    vec2 e;
    vec2 w;
    vec2 b;
    bvec3 c;
    // for(int i=0, j=numPoints-1; i < numPoints; j=i, i++) { // start unrolled loop
    `;

    for (let i = 0, j = points.length - 1; i < points.length; j = i, i++) {
        const p_i = pointName(i);
        const p_j = pointName(j);
        sksl += `
        // iteration ${i}
        e = ${p_j} - ${p_i};
        w =    p - ${p_i};
        b = w - e*clamp( dot(w,e)/dot(e,e), 0.0, 1.0 );
        d = min( d, dot(b,b) );
        c = bvec3( p.y>=${p_i}.y, p.y <${p_j}.y, e.x*w.y>e.y*w.x );
        if( all(c) || all(not(c)) ) s=-s;
        `;
    }

    sksl += `
    // } // end unrolled loop
    return s * sqrt(d);
}`;

    return sksl;
}
