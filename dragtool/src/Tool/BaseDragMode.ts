import { ToolContext, ToolEvent } from "@owlbear-rodeo/sdk";
import DragState from "../DragState";
import { deleteAllSequencesForCurrentPlayer } from "../Sequence/utils";

export default abstract class BaseDragMode {
    private readonly readAndClearScalingJustClicked: () => boolean;
    protected dragState: DragState | null;

    constructor(readAndClearScalingJustClicked: () => boolean) {
        this.readAndClearScalingJustClicked = readAndClearScalingJustClicked;
        this.dragState = null;
    }

    async onToolDragMove(_: ToolContext, event: ToolEvent) {
        await this.dragState?.update(event.pointerPosition);
    }

    async onToolDragEnd(_: ToolContext, event: ToolEvent) {
        await this.dragState?.finish(event.pointerPosition);
        this.dragState = null;
    }

    async onToolDragCancel() {
        await this.dragState?.cancel();
        this.dragState = null;
    }

    async onDeactivate() {
        if (!this.readAndClearScalingJustClicked()) {
            await deleteAllSequencesForCurrentPlayer();
        }
    }
}