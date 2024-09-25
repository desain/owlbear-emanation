import { ToolAction } from "@owlbear-rodeo/sdk";
import clear from "../../assets/clear.svg";
import { PLUGIN_ID, TOOL_ID } from "../constants";
import { deleteAllSequencesForCurrentPlayer } from "../Sequence/utils";

const CLEAR_ACTION: ToolAction = {
    id: `${PLUGIN_ID} /tool-action-clear`,
    shortcut: 'Enter',
    icons: [{
        icon: clear,
        label: "Clear Measurements",
        filter: {
            activeTools: [TOOL_ID],
        },
    }],
    async onClick() {
        await deleteAllSequencesForCurrentPlayer();
    },
};

export default CLEAR_ACTION;