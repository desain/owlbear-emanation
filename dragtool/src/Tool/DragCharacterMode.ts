import { ToolContext, ToolEvent, ToolMode } from "@owlbear-rodeo/sdk";
import walk from "../../assets/walk.svg";
import { DRAG_MODE_ID, TOOL_ID } from "../constants";
import { DRAGGABLE_CHARACTER_FILTER, DRAGGABLE_CHARACTER_FILTER_INVERSE, isDraggableCharacter } from "../DraggableCharacter";
import DragState from "../DragState";
import { deleteAllSequencesForCurrentPlayer } from "../Sequence/utils";
import BaseDragMode from "./BaseDragMode";

export default class DragCharacterMode extends BaseDragMode implements ToolMode {
    id = DRAG_MODE_ID;

    shortcut = 'G';

    icons = [
        {
            icon: walk,
            label: 'Move Character',
            filter: {
                activeTools: [TOOL_ID, /*'rodeo.owlbear.tool/move'*/],
            },
        },
    ];

    preventDrag = {
        target: DRAGGABLE_CHARACTER_FILTER_INVERSE,
    };

    cursors = [
        {
            cursor: 'grabbing',
            filter: {
                dragging: true,
                target: DRAGGABLE_CHARACTER_FILTER,
            }
        },
        {
            cursor: 'grab',
            filter: {
                target: DRAGGABLE_CHARACTER_FILTER,
            }
        },
        {
            cursor: 'move',
        },
    ];

    async onToolDragStart(context: ToolContext, event: ToolEvent) {
        if (event.transformer || !isDraggableCharacter(event.target) || this.dragState != null) {
            return;
        }
        if (typeof context.metadata.distanceScaling !== 'number') {
            throw 'Invalid metadata';
        }

        this.dragState = await DragState.createDrag(
            event.target,
            event.pointerPosition,
            context.metadata.distanceScaling,
            false,
            false
        );
    }

    async onToolDoubleClick(_: ToolContext, event: ToolEvent) {
        if (isDraggableCharacter(event.target, false)) {
            return true;
        } else {
            await deleteAllSequencesForCurrentPlayer();
            return false;
        }
    }
}