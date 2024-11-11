import { Vector3 } from '@owlbear-rodeo/sdk/lib/types/Vector3';

function parseColor(color: string) {
    return /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
}

export function isHexColor(color: string): boolean {
    return parseColor(color) !== null;
}

export function hexToRgb(hex: string): Vector3 | null {
    var result = parseColor(hex);
    return result ? {
        x: parseInt(result[1], 16) / 255,
        y: parseInt(result[2], 16) / 255,
        z: parseInt(result[3], 16) / 255,
    } : null;
}

export function rgbToHex({ x, y, z }: Vector3): string {
    const r = Math.floor(x * 255), g = Math.floor(y * 255), b = Math.floor(z * 255);
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}