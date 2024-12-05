import { Matrix, Vector2 } from "@owlbear-rodeo/sdk";

export const PI_6 = Math.PI / 6; // 30 deg
export const SQRT_3 = Math.sqrt(3);

/**
 * Why isn't this in MathM?
 * @param m a b c
 *          d e f
 *          g h i
 * @param v x
 *          y
 *          (z = implicit 1)
 * @returns ax + by + c
 *          dx + ey + f
 */
export function matrixMultiply(m: Matrix, v: Vector2): Vector2 {
    const [a, b, c, d, e, f] = m;
    return {
        x: a * v.x + b * v.y + c,
        y: d * v.x + e * v.y + f,
    };
}

export function degToRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
}
