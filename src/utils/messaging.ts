import OBR, { BlendMode } from "@owlbear-rodeo/sdk";
import {
    AuraStyle,
    AuraStyleType,
    createStyle,
    getColor,
    getOpacity,
    isAuraStyle,
} from "../types/AuraStyle";
import { isCandidateSource } from "../types/CandidateSource";
import { usePlayerSettings } from "../usePlayerSettings";
import { isHexColor } from "./colorUtils";
import { createAuras } from "./createAuras";
import { isObject } from "./jsUtils";
import { isBlendMode } from "./obrTypeUtils";
import { removeAllAuras } from "./removeAuras";

const CREATE_AURAS_TYPE = "CREATE_AURAS";
const REMOVE_AURAS_TYPE = "REMOVE_AURAS";

export interface CreateAurasMessage {
    type: typeof CREATE_AURAS_TYPE;
    /**
     *  Item IDs for character images that will receive auras.
     */
    sources: string[];
    /**
     * Aura size, e.g 5 for 5ft.
     */
    size: number;
    /**
     * Style of aura to create. If not provided, the current player's default style will be used.
     */
    style?: AuraStyleType;
    /**
     * Hex code, e.g "#d00dad". If not provided, the current player's default color will be used.
     */
    color?: string;
    /**
     * Number from 0 (fully transparent) to 1 (fully opaque). If not provided, the current player's default opacity will be used.
     */
    opacity?: number;
    /**
     * ID of player this aura will be visible to. If not provided, the aura will be visible to eveyrone.
     * If set to null, the aura will not be visible.
     */
    visibleTo?: string | null;
    /**
     * Blend mode for effect-based auras. Only used if the `style` parameter is an effect type. If not provided,
     * the default SRC_OVER value will be used.
     */
    blendMode?: BlendMode;
}
export function isCreateAuraMessage(
    message: unknown,
): message is CreateAurasMessage {
    return (
        isObject(message) &&
        "type" in message &&
        message.type === CREATE_AURAS_TYPE &&
        "sources" in message &&
        Array.isArray(message.sources) &&
        message.sources.every(
            (source: unknown) => typeof source === "string",
        ) &&
        "size" in message &&
        typeof message.size === "number" &&
        Number.isInteger(message.size) &&
        message.size > 0 &&
        (!("style" in message) ||
            (typeof message.style === "string" &&
                isAuraStyle(message.style))) &&
        (!("color" in message) ||
            (typeof message.color === "string" && isHexColor(message.color))) &&
        (!("opacity" in message) ||
            (typeof message.opacity === "number" &&
                message.opacity >= 0 &&
                message.opacity <= 1)) &&
        (!("visibleTo" in message) || typeof message.visibleTo === "string") &&
        (!("blendMode" in message) ||
            (typeof message.blendMode === "string" &&
                isBlendMode(message.blendMode)))
    );
}

export function getStyle(message: CreateAurasMessage): AuraStyle {
    const playerSettings = usePlayerSettings.getState();
    const style: AuraStyleType = message.style ?? playerSettings.style.type;
    const color = message.color ?? getColor(playerSettings.style);
    const opacity = message.opacity ?? getOpacity(playerSettings.style);
    return createStyle(style, color, opacity, message.blendMode);
}

interface RemoveAurasMessage {
    type: typeof REMOVE_AURAS_TYPE;
    /**
     *  Item IDs for character images that will have all auras removed.
     */
    sources: string[];
}

function isRemoveAurasMessage(message: unknown): message is RemoveAurasMessage {
    return (
        isObject(message) &&
        "type" in message &&
        message.type === REMOVE_AURAS_TYPE &&
        "sources" in message &&
        Array.isArray(message.sources) &&
        message.sources.every((source: unknown) => typeof source === "string")
    );
}

export async function handleMessage(data: unknown) {
    if (isCreateAuraMessage(data)) {
        const sources = (await OBR.scene.items.getItems(data.sources)).filter(
            isCandidateSource,
        );
        if (sources.length > 0) {
            return await createAuras(
                sources,
                data.size,
                getStyle(data),
                data.visibleTo,
            );
        } else {
            console.warn("[Auras] No images found for sources", data.sources);
        }
    } else if (isRemoveAurasMessage(data)) {
        if (data.sources.length > 0) {
            return await removeAllAuras(data.sources);
        }
    } else {
        console.warn("[Auras] Unknown Auras message", data);
    }
}
