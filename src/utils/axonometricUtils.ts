import { GridType, MathM, Matrix, Vector2 } from "@owlbear-rodeo/sdk";
import { degToRad, PI_6 } from "./mathUtils";

const ANGLE_DIMETRIC = 26.5;
export const SCALE_ISOMETRIC: Vector2 = {
    x: Math.SQRT1_2 / Math.tan(PI_6),
    y: Math.SQRT1_2,
};
export const SCALE_DIMETRIC: Vector2 = {
    x: Math.SQRT1_2 / Math.tan(degToRad(ANGLE_DIMETRIC)),
    y: Math.SQRT1_2,
};
const ROTATE45 = MathM.fromRotation(45);
export const TRANSFORM_ISOMETRIC = MathM.multiply(
    MathM.fromScale(SCALE_ISOMETRIC),
    ROTATE45,
);
export const TRANSFORM_DIMETRIC = MathM.multiply(
    MathM.fromScale(SCALE_DIMETRIC),
    ROTATE45,
);
export const INVERSE_TRANSFORM_ISOMETRIC = MathM.inverse(TRANSFORM_ISOMETRIC);
export const INVERSE_TRANSFORM_DIMETRIC = MathM.inverse(TRANSFORM_DIMETRIC);

export function getAxonometricTransformMatrix(gridType: GridType): Matrix | null {
    if (gridType === "ISOMETRIC") {
        return TRANSFORM_ISOMETRIC;
    } else if (gridType === "DIMETRIC") {
        return TRANSFORM_DIMETRIC;
    } else {
        return null;
    }
}

export function getScale(gridType: GridType): Vector2 {
    if (gridType === "ISOMETRIC") {
        return SCALE_ISOMETRIC;
    } else if (gridType === "DIMETRIC") {
        return SCALE_DIMETRIC;
    } else {
        return { x: 1, y: 1 };
    }
}
