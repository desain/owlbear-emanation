import { buildLabel, Item, Label } from "@owlbear-rodeo/sdk";
import { ZIndex } from "../constants";
import { SequenceItem } from "../metadataUtils";
import { buildSequenceItem } from "./SequenceItem";

export type WaypointLabel = Label & SequenceItem;

export function createWaypointLabel(target: Item): WaypointLabel {
    // Labels always go above characters so put them on the ruler layer
    return buildSequenceItem(target, 'RULER', ZIndex.LABEL, {}, buildLabel()
        .name(`Path Label for ${target.name}`)
        .position(target.position)
        .backgroundColor('black')
        .backgroundOpacity(0.6)
        .pointerDirection('DOWN')
        .pointerWidth(20)
        .pointerHeight(40));
}