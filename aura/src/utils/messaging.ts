import OBR, { isImage } from '@owlbear-rodeo/sdk';
import { AuraStyleType, createStyle, isAuraStyle } from '../types/AuraStyle';
import { getPlayerMetadata } from '../types/metadata/PlayerMetadata';
import { isHexColor } from './colorUtils';
import { createAuras } from './createAuras';
import { isObject } from "./jsUtils";
import { removeAuras } from "./removeAuras";

const CREATE_AURAS_TYPE = 'CREATE_AURAS';
const REMOVE_AURAS_TYPE = 'REMOVE_AURAS';

interface CreateAurasMessage {
    type: typeof CREATE_AURAS_TYPE;
    sources: string[];
    size: number;
    style?: AuraStyleType;
    color?: string;
    opacity?: number;
}

interface RemoveAurasMessage {
    type: typeof REMOVE_AURAS_TYPE;
    sources: string[];
}

function isCreateAuraMessage(message: any): message is CreateAurasMessage {
    const hasMandatoryTypes = isObject(message)
        && message.type === CREATE_AURAS_TYPE
        && Array.isArray(message.sources)
        && message.sources.every((source: any) => typeof source === 'string')
        && typeof message.size === 'number'
        && Number.isInteger(message.size)
        && message.size > 0;
    const hasValidStyle = message.style === undefined ||
        (typeof message.style === 'string' && isAuraStyle(message.style));
    const hasValidColor = message.color === undefined ||
        (typeof message.color === 'string' && isHexColor(message.color));
    const hasValidOpacity = message.opacity === undefined ||
        (typeof message.opacity === 'number' && message.opacity >= 0 && message.opacity <= 1);
    return hasMandatoryTypes && hasValidStyle && hasValidColor && hasValidOpacity;
}

function isRemoveAurasMessage(message: any): message is RemoveAurasMessage {
    return isObject(message)
        && message.type === REMOVE_AURAS_TYPE
        && Array.isArray(message.sources)
        && message.sources.every((source: any) => typeof source === 'string');
}

export async function handleMessage(data: unknown) {
    if (isCreateAuraMessage(data)) {
        const sources = (await OBR.scene.items.getItems(data.sources)).filter(isImage);
        if (sources.length > 0) {
            const playerMetadata = await getPlayerMetadata();
            const style: AuraStyleType = data.style ?? playerMetadata.styleType;
            const color = data.color ?? playerMetadata.color;
            const opacity = data.opacity ?? playerMetadata.opacity;
            return await createAuras(sources, data.size, createStyle(style, color, opacity));
        }
    } else if (isRemoveAurasMessage(data)) {
        if (data.sources.length > 0) {
            return await removeAuras(data.sources);
        }
    } else {
        console.warn('Unknown Auras message', data);
    }
}