import { CurveStyle, ShapeStyle } from '@owlbear-rodeo/sdk';
import { Vector3 } from '@owlbear-rodeo/sdk/lib/types/Vector3';
import { PlayerMetadata } from '../metadata/PlayerMetadata';
import { hexToRgb, rgbToHex } from '../utils/colorUtils';

export interface SimpleStyle {
    type: 'Simple';
    itemStyle: ShapeStyle | CurveStyle;
}

export interface BubbleStyle {
    type: 'Bubble';
    color: Vector3;
    opacity: number;
}

export interface SpiritsStyle {
    type: 'Spirits';
}

export type EffectStyle = BubbleStyle | SpiritsStyle;
export type EffectStyleType = EffectStyle['type'];
export type AuraStyle = SimpleStyle | EffectStyle;
export type AuraStyleType = AuraStyle['type'];
export const STYLE_TYPES: AuraStyleType[] = ['Simple', 'Bubble', 'Spirits'];

export function createStyle(styleType: AuraStyleType, color: string, opacity: number): AuraStyle {
    return styleType === 'Simple'
        ? {
            type: styleType,
            itemStyle: {
                fillColor: color,
                fillOpacity: opacity,
                strokeColor: color,
                strokeOpacity: 1,
                strokeWidth: 10,
                strokeDash: [],
            },
        } : styleType === 'Bubble' ? {
            type: styleType,
            color: hexToRgb(color) ?? { x: 1, y: 0, z: 1 },
            opacity: opacity,
        } : {
            type: styleType,
        };
}

export function getColor(style: AuraStyle, playerMetadata: PlayerMetadata): string {
    switch (style.type) {
        case 'Bubble':
            return rgbToHex(style.color);
        case 'Simple':
            return style.itemStyle.fillColor;
        case 'Spirits':
            return playerMetadata.color;
        default:
            const _exhaustiveCheck: never = style;
            throw new Error(`Unhandled aura type: ${_exhaustiveCheck}`);
    }
}

export function getOpacity(style: AuraStyle, playerMetadata: PlayerMetadata): number {
    switch (style.type) {
        case 'Bubble':
            return style.opacity;
        case 'Simple':
            return style.itemStyle.fillOpacity;
        case 'Spirits':
            return playerMetadata.opacity;
        default:
            const _exhaustiveCheck: never = style;
            throw new Error(`Unhandled aura type: ${_exhaustiveCheck}`);
    }
}