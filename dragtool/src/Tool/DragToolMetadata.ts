import OBR from "@owlbear-rodeo/sdk";
import { TOOL_ID } from "../constants";

export type DragToolMetadata = {
    distanceScaling: number,
}

export const DEFAULT_METADATA: DragToolMetadata = { distanceScaling: 1 };

export async function setToolMetadata(update: Partial<DragToolMetadata>) {
    await OBR.tool.setMetadata(TOOL_ID, update);
}