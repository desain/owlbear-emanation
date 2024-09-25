import { Tool } from "@owlbear-rodeo/sdk";
import walk from "../../assets/walk.svg";
import { DRAG_MODE_ID, TOOL_ID } from "../constants";
import { DEFAULT_METADATA, setToolMetadata } from "./DragToolMetadata";

const DRAG_TOOL: Tool = {
    id: TOOL_ID,
    icons: [{
        icon: walk,
        label: "Drag path",
    }],
    shortcut: 'Z',
    defaultMetadata: DEFAULT_METADATA,
    defaultMode: DRAG_MODE_ID,
    async onClick() {
        await setToolMetadata({ distanceScaling: 1 });
        return true;
    },
};
export default DRAG_TOOL;