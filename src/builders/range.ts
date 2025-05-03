import type { GridParsed} from "owlbear-utils";
import { PI_6, SQRT_3 } from "owlbear-utils";
import type { AuraShape } from "../types/AuraShape";
import {
    createAxonometricTransform,
    createDistanceFunction,
    createItemRadius,
} from "../utils/skslUtils";
import axialRound from "./shaders/axialRound.glsl";
import range from "./shaders/range.frag";

function createRoundToCell(shape: AuraShape) {
    let expression: string;
    if (shape === "hex_hexes") {
        expression = "axial_round(p)";
    } else if (
        shape === "square" ||
        shape === "alternating_squares" ||
        shape === "manhattan_squares"
    ) {
        // starting from the corner, anything between 0 and 1 belongs to 1, etc
        expression = "ceil(p)";
    } else {
        expression = "p";
    }
    return `vec2 roundToCell(vec2 p) {
        return ${expression};
    }`;
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

function createTransformCoordinateSpace(grid: GridParsed, shape: AuraShape) {
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
        expression = "max(vec2(0.0), abs(p) - itemRadiusUnits)";
    } else {
        expression = "p";
    }

    return `vec2 transformCoordinateSpace(vec2 p) {
        return ${expression};
    }`;
}

export function getRangeSksl(grid: GridParsed, shape: AuraShape): string {
    return [
        axialRound,
        createRoundToCell(shape),
        createDistanceFunction(shape),
        createAxonometricTransform(grid.type),
        createTransformCoordinateSpace(grid, shape),
        createItemRadius(shape),
        range,
    ].join("\n");
}
