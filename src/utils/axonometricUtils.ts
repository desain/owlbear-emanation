import type { GridType, Matrix } from "@owlbear-rodeo/sdk";
import { MathM } from "@owlbear-rodeo/sdk";
import { SCALE_DIMETRIC, SCALE_ISOMETRIC } from "owlbear-utils";

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

export function getAxonometricTransformMatrix(
    gridType: GridType,
): Matrix | null {
    if (gridType === "ISOMETRIC") {
        return TRANSFORM_ISOMETRIC;
    } else if (gridType === "DIMETRIC") {
        return TRANSFORM_DIMETRIC;
    } else {
        return null;
    }
}
