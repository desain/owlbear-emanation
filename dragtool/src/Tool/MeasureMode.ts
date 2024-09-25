import { Item, ToolContext, ToolEvent, ToolMode, Vector2 } from "@owlbear-rodeo/sdk";
import ruler from "../../assets/ruler.svg";
import rulerPrivate from "../../assets/rulerPrivate.svg";
import { PLUGIN_ID, TOOL_ID } from "../constants";
import { isDraggableCharacter } from "../DraggableCharacter";
import DragState from "../DragState";
import { DRAG_MARKER_FILTER, isDragMarker } from "../Sequence/DragMarker";
import { deleteAllSequencesForCurrentPlayer } from "../Sequence/utils";
import BaseDragMode from "./BaseDragMode";


export default class MeasureMode extends BaseDragMode implements ToolMode {
    public static PUBLIC = false;
    public static PRIVATE = true;
    private readonly privateMode: boolean;

    constructor(readAndClearScalingJustClicked: () => boolean, privateMode: boolean) {
        super(readAndClearScalingJustClicked);
        this.privateMode = privateMode;
    }

    get id() {
        return `${PLUGIN_ID}/measure-path-mode${this.privateMode ? '-private' : ''}`;
    }

    get shortcut() {
        return this.privateMode ? 'P' : 'R'
    }

    get icons() {
        return [
            {
                icon: this.privateMode ? rulerPrivate : ruler,
                label: `Measure Path${this.privateMode ? ' (Private)' : ''} `,
                filter: {
                    activeTools: [TOOL_ID],
                },
            }
        ];
    }

    cursors = [
        {
            cursor: 'grabbing',
            filter: {
                dragging: true,
                target: DRAG_MARKER_FILTER,
            }
        },
        {
            cursor: 'grab',
            filter: {
                target: DRAG_MARKER_FILTER,
            }
        },
        {
            cursor: 'crosshair',
        },
    ];

    async onToolDragStart(context: ToolContext, event: ToolEvent) {
        if (this.dragState != null) {
            return;
        }
        if (typeof context.metadata.distanceScaling !== 'number') {
            throw 'Invalid metadata';
        }

        let startPosition: Vector2;
        let target: Item | null;
        if (isDragMarker(event.target)) {
            startPosition = event.target.position;
            target = event.target;
        } else if (isDraggableCharacter(event.target)) {
            startPosition = event.target.position;
            target = null;
        } else {
            startPosition = event.pointerPosition;
            target = null;
        }

        this.dragState = await DragState.createDrag(
            target,
            startPosition,
            context.metadata.distanceScaling,
            this.privateMode,
            true,
        );
    }

    async onToolDoubleClick(_: ToolContext, event: ToolEvent) {
        if (isDragMarker(event.target)) {
            return true;
        } else {
            await deleteAllSequencesForCurrentPlayer();
            return false;
        }
    }
}