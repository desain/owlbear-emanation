import OBR, { isImage } from "@owlbear-rodeo/sdk";
import { AuraStyleType, createStyle, isAuraStyle } from "../types/AuraStyle";
import { getPlayerMetadata } from "../types/metadata/PlayerMetadata";
import { isHexColor } from "./colorUtils";
import { createAuras } from "./createAuras";
import { isObject } from "./jsUtils";
import { removeAuras } from "./removeAuras";

const CREATE_AURAS_TYPE = "CREATE_AURAS";
const REMOVE_AURAS_TYPE = "REMOVE_AURAS";

interface CreateAurasMessage {
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
     * Hex code, e.g #d00dad. If not provided, the current player's default color will be used.
     */
    color?: string;
    /**
     * Number from 0 (fully transparent) to 1 (fully opaque). If not provided, the current player's default opacity will be used.
     */
    opacity?: number;
}

function isCreateAuraMessage(message: unknown): message is CreateAurasMessage {
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
                message.opacity <= 1))
    );
}

interface RemoveAurasMessage {
    type: typeof REMOVE_AURAS_TYPE;
    /**
     *  Item IDs for character images that will receive auras.
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
            isImage,
        );
        if (sources.length > 0) {
            const playerMetadata = await getPlayerMetadata();
            const style: AuraStyleType = data.style ?? playerMetadata.styleType;
            const color = data.color ?? playerMetadata.color;
            const opacity = data.opacity ?? playerMetadata.opacity;
            return await createAuras(
                sources,
                data.size,
                createStyle(style, color, opacity),
            );
        }
    } else if (isRemoveAurasMessage(data)) {
        if (data.sources.length > 0) {
            return await removeAuras(data.sources);
        }
    } else {
        console.warn("Unknown Auras message", data);
    }
}
