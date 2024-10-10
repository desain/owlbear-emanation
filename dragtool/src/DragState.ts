import OBR, { Item, Math2, Vector2 } from "@owlbear-rodeo/sdk";
import { AbstractInteraction, createLocalInteraction, wrapRealInteraction } from "./AbstractInteraction";
import { METADATA_KEY } from "./constants";
import { createDragMarker } from "./Sequence/DragMarker";
import { assertHasMetadata } from "./Sequence/metadataUtils";
import { Segment, createSegment, getSegmentText } from "./Sequence/Segment";
import { SequenceTarget, createDraggingSequenceTargetMetadata } from "./Sequence/SequenceTarget";
import { Sweep, SweepData, getSweeps } from "./Sequence/Sweep";
import { getSequenceLength } from "./Sequence/utils";
import { Waypoint, createWaypoint } from "./Sequence/Waypoint";
import { WaypointLabel, createWaypointLabel, getWaypointLabelText } from "./Sequence/WaypointLabel";
import Snapper from "./Snapper";

export default class DragState {
    private readonly start: Vector2;
    private end: Vector2;
    private readonly sweepData: SweepData[];
    private readonly interaction: AbstractInteraction<Item[]>;
    private readonly snapper: Snapper;
    private readonly distanceScaling: number;
    /**
     * Distance the target has traveled before the current drag.
     */
    private readonly baseDistance: number;
    /**
     * Whether the target was created just for this drag (e.g it's a marker for a measurement).
     */
    private readonly targetIsNew: boolean;

    static setupOrCreateTarget(
        targetArg: Item | null,
        positionForNew: Vector2,
        dpi: number,
        playerColor: string,
        privateMode: boolean,
    ): { target: SequenceTarget, targetIsNew: boolean } {
        let target: SequenceTarget;
        let targetIsNew = targetArg === null;
        if (targetArg === null) {
            target = createDragMarker(
                positionForNew,
                dpi,
                playerColor,
                privateMode,
            );
        } else {
            targetArg.metadata[METADATA_KEY] = createDraggingSequenceTargetMetadata();
            target = assertHasMetadata(targetArg);
        }
        return { target, targetIsNew };
    }

    /**
     * Create a new drag state and create all necessary items.
     * @param targetArg Item to start moving, or null to create a marker.
     * @param pointerPosition Position of mouse pointer.s
     * @param privateMode Whether to use only local items. Must not be set when the item is not a local item.
     * @param aboveCharacters Whether to place the sequence items above characters in the Z order.
     * @returns New drag state.
     */
    static async createDrag(
        targetArg: Item | null,
        pointerPosition: Vector2,
        distanceScaling: number,
        privateMode: boolean,
        aboveCharacters: boolean,
    ): Promise<DragState> {
        const [measurement, gridType, dpi, playerColor] = await Promise.all([
            OBR.scene.grid.getMeasurement(),
            OBR.scene.grid.getType(),
            OBR.scene.grid.getDpi(),
            OBR.player.getColor(),
        ]);

        const snapper = new Snapper(targetArg, measurement, gridType);
        const layer = aboveCharacters ? 'RULER' : 'DRAWING';
        const end = await snapper.snap(pointerPosition);
        let { target, targetIsNew } = DragState.setupOrCreateTarget(targetArg, end, dpi, playerColor, privateMode);
        const { sweeps, sweepDatas: sweepData } = await getSweeps(target);
        const ruler = createSegment(target, end, layer, distanceScaling);
        const waypoint = createWaypoint(target, layer, dpi, playerColor);
        const waypointLabel = createWaypointLabel(target);
        const interactionItems = DragState.composeItems({ target, sweeps, ruler, waypointLabel, waypoint });
        const interaction: AbstractInteraction<Item[]> = privateMode
            ? await createLocalInteraction(interactionItems)
            : await wrapRealInteraction(interactionItems);

        return new DragState(
            target.position,
            end,
            await getSequenceLength(target.id, interaction.itemApi),
            distanceScaling,
            interaction,
            sweepData,
            snapper,
            targetIsNew,
        );
    }

    private constructor(
        start: Vector2,
        end: Vector2,
        baseDistance: number,
        distanceScaling: number,
        interaction: AbstractInteraction<Item[]>,
        sweepData: SweepData[],
        snapper: Snapper,
        targetIsNew: boolean,
    ) {
        this.start = start;
        this.end = end;
        this.baseDistance = baseDistance;
        this.distanceScaling = distanceScaling;
        this.interaction = interaction;
        this.snapper = snapper;
        this.targetIsNew = targetIsNew;
        this.sweepData = sweepData;
    }

    /**
     * Set endpoint, snapping to grid.
     * @param end Non-snapped endpoint
     * @returns Whether the endpoint changed.
     */
    private async setEnd(end: Vector2) {
        const oldEnd = this.end;
        this.end = await this.snapper.snap(end);
        return oldEnd.x != this.end.x || oldEnd.y != this.end.y;
    }

    private static composeItems({ target, sweeps, ruler, waypointLabel, waypoint }: ReturnType<typeof DragState.prototype.decomposeItems>): Item[] {
        // For some reason OBR wants existing items first in the interaction array, then newly created ones.
        // It doesn't display updates to the existing items if existing items are at the back.
        return [target, ...sweeps, ruler, waypointLabel, waypoint];
    }

    /**
     * Break down the misc items in an interaction.
     * @param items Misc items
     * @returns object that labels items
     */
    private decomposeItems(items: Item[]) {
        let idx = 0;
        const target = items[idx++] as SequenceTarget;

        const numSweeps = this.sweepData.length;
        const sweeps = items.slice(idx, idx += numSweeps) as Sweep[];

        const ruler = items[idx++] as Segment;
        const waypointLabel = items[idx++] as WaypointLabel;
        const waypoint = items[idx++] as Waypoint;
        return { target, sweeps, ruler, waypointLabel, waypoint };
    }

    async update(pointerPosition: Vector2) {
        const changedEnd = await this.setEnd(pointerPosition);
        const [unadjustedNewDistance, scale] = await Promise.all([
            OBR.scene.grid.getDistance(this.start, this.end),
            OBR.scene.grid.getScale(),
        ]);
        const adjustedNewDistance = unadjustedNewDistance * this.distanceScaling;
        const totalDistance = this.baseDistance + adjustedNewDistance;
        const { update } = this.interaction;
        const items = await update((items) => {
            if (changedEnd) {
                const { target, sweeps, ruler, waypointLabel } = this.decomposeItems(items);
                waypointLabel.text = { ...waypointLabel.text, plainText: getWaypointLabelText(totalDistance, scale) };
                waypointLabel.position = this.end;

                ruler.endPosition = this.end;
                ruler.measurement = getSegmentText(unadjustedNewDistance, scale, this.distanceScaling);

                target.position = this.end;

                const movementVector = Math2.subtract(this.end, this.start);
                for (let i = 0; i < sweeps.length; i++) {
                    const sweep = sweeps[i];
                    const startPosition = Math2.add(this.start, this.sweepData[i].baseOffset);
                    const sweepCommands = this.sweepData[i].sweeper(startPosition, movementVector);
                    sweep.commands = [...this.sweepData[i].baseCommands, ...sweepCommands];
                }
            }
        });
        return this.decomposeItems(items);
    }

    async finish(pointerPosition: Vector2) {
        if (this.start.x === this.end.x && this.start.y === this.end.y) {
            await this.cancel();
            return;
        }

        const { target, ruler, waypointLabel, sweeps, waypoint } = await this.update(pointerPosition);
        const { keepAndStop, itemApi } = this.interaction;

        const toAdd: Item[] = [ruler, waypointLabel, waypoint, ...sweeps];
        if (this.targetIsNew) {
            toAdd.push(target);
        } else {
            // Network item values snap back by default so update it for real
            // Do this before stopping the interaction to avoid visual flicker
            await itemApi.updateItems([target.id], ([realTarget]) => {
                realTarget.position = target.position;
                realTarget.metadata[METADATA_KEY] = target.metadata[METADATA_KEY];
                // This triggers an update which checks if the target has moved outside its sequence,
                // so don't mark it as done dragging yet so we skip that check, since the sequence
                // segment for this move doesn't exist yet for network drags
            });
        }

        await keepAndStop(toAdd);

        // Now that the sequence segment definitely exists, we can mark the item as not being dragged
        await itemApi.updateItems([target], ([target]) => {
            let sequenceItemTarget: SequenceTarget = assertHasMetadata(target);
            sequenceItemTarget.metadata[METADATA_KEY].activelyDragging = false;
        });
    }

    async cancel() {
        const { keepAndStop } = this.interaction;
        await keepAndStop([]);
    }
}