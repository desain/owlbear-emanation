import OBR from "@owlbear-rodeo/sdk";
import edit from "../../assets/edit.svg";

import { ID_TOOL, ID_TOOL_MODE_SHIFT_AURA } from "../constants";
import { ShiftMode } from "./ShiftMode";

export async function activateTool() {
    await Promise.all([
        OBR.tool.create({
            id: ID_TOOL,
            icons: [
                {
                    icon: edit,
                    label: "Edit Auras (double click to reset)",
                },
            ],
            defaultMetadata: {},
            defaultMode: ID_TOOL_MODE_SHIFT_AURA,
        }),
        OBR.tool.createMode(new ShiftMode()),
    ]);
    await OBR.tool.activateTool(ID_TOOL);
}

export function deactivateTool() {
    return Promise.all([
        OBR.tool.remove(ID_TOOL),
        OBR.tool.removeMode(ID_TOOL_MODE_SHIFT_AURA),
    ]);
}
