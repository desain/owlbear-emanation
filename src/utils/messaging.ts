import type {
    BlendMode,
    ImageContent,
    ImageGrid,
    Layer,
} from "@owlbear-rodeo/sdk";
import OBR from "@owlbear-rodeo/sdk";
import type { HexColor, Units } from "owlbear-utils";
import { isBlendMode, isHexColor, isLayer, isObject } from "owlbear-utils";
import { usePlayerStorage } from "../state/usePlayerStorage";
import type { AuraConfig } from "../types/AuraConfig";
import { DEFAULT_AURA_CONFIG } from "../types/AuraConfig";
import type { AuraStyle, AuraStyleType } from "../types/AuraStyle";
import {
    createStyle,
    getColor,
    getOpacity,
    isAuraStyleType,
} from "../types/AuraStyle";
import { isCandidateSource } from "../types/CandidateSource";
import { createAuras } from "./createAuras";
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
    size: Units;
    /**
     * Style of aura to create. If not provided, the current player's default style will be used.
     */
    style?: AuraStyleType;
    /**
     * Hex code, e.g "#d00dad". If not provided, the current player's default color will be used.
     */
    color?: HexColor;
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
     * Which Owlbear Rodeo layer the aura will be on. If not provided, the `"DRAWING"` layer
     * will be used.
     */
    layer?: Layer;
    /**
     * Blend mode for effect-based auras. Only used if the `style` parameter is an effect type. If not provided,
     * the default `"SRC_OVER"` value will be used.
     */
    blendMode?: BlendMode;
    /**
     * Details for image-based auras. Must be provided if and only if the `style` parameter is `"Image"`.
     */
    imageBuildParams?: {
        image: ImageContent;
        grid: ImageGrid;
    };
    /**
     * Shader code for custom auras. Must be provided if and only if the `style` parameter is `"Custom"`.
     */
    sksl?: string;
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
            message.style === undefined ||
            (typeof message.style === "string" &&
                isAuraStyleType(message.style))) &&
        (!("color" in message) ||
            message.color === undefined ||
            (typeof message.color === "string" && isHexColor(message.color))) &&
        (!("opacity" in message) ||
            message.opacity === undefined ||
            (typeof message.opacity === "number" &&
                message.opacity >= 0 &&
                message.opacity <= 1)) &&
        (!("visibleTo" in message) ||
            message.visibleTo === undefined ||
            typeof message.visibleTo === "string") &&
        (!("layer" in message) ||
            message.layer === undefined ||
            (typeof message.layer === "string" && isLayer(message.layer))) &&
        (!("blendMode" in message) ||
            message.blendMode === undefined ||
            (typeof message.blendMode === "string" &&
                isBlendMode(message.blendMode))) &&
        (!("imageBuildParams" in message) ||
            message.imageBuildParams === undefined ||
            (isObject(message.imageBuildParams) &&
                "image" in message.imageBuildParams &&
                isObject(message.imageBuildParams.image) &&
                "grid" in message.imageBuildParams &&
                isObject(message.imageBuildParams.grid))) &&
        (!("sksl" in message) ||
            message.sksl === undefined ||
            typeof message.sksl === "string")
    );
}

export function toConfig(message: CreateAurasMessage): AuraConfig {
    return {
        size: message.size,
        style: getStyle(message),
        visibleTo: message.visibleTo,
        layer: message.layer,
    };
}

function getStyle(message: CreateAurasMessage): AuraStyle {
    const playerSettings = usePlayerStorage.getState();
    const defaultConfig =
        playerSettings.presets[0]?.config ?? DEFAULT_AURA_CONFIG;
    const styleType: AuraStyleType = message.style ?? defaultConfig.style.type;
    const color = message.color ?? getColor(defaultConfig.style);
    const opacity = message.opacity ?? getOpacity(defaultConfig.style);
    const sksl = message.sksl;
    return createStyle({
        styleType,
        color,
        opacity,
        blendMode: message.blendMode,
        imageBuildParams: message.imageBuildParams,
        sksl,
    });
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
            return await createAuras(sources, toConfig(data));
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
