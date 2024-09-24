import OBR, { GridMeasurement, GridScale, GridType, Item, Math2, PathCommand, Vector2, isImage } from "@owlbear-rodeo/sdk";
import { AbstractInteraction, createLocalInteraction, wrapRealInteraction } from "./AbstractInteraction";
import { METADATA_KEY } from "./constants";
import { createDragMarker } from "./Sequence/DragMarker";
import { Segment, createSegment } from "./Sequence/Segment";
import { SequenceSweep, isSequenceSweep } from "./Sequence/SequenceSweep";
import { createSequenceTargetMetadata } from "./Sequence/SequenceTarget";
import { belongsToSequenceForTarget, getEmanations, getOrCreateSweep, getSequenceLength } from "./Sequence/utils";
import { Waypoint, createWaypoint } from "./Sequence/Waypoint";
import { WaypointLabel, createWaypointLabel } from "./Sequence/WaypointLabel";
import { Sweeper, getSweeper } from "./Sweeper";

/**
 * Type that represents the data needed to sweep a path.
 */
type SweepData = {
    /**
     * Commands from the sweeps for the emanation so far.
     */
    baseCommands: PathCommand[],
    sweeper: Sweeper,
    /**
     * Emanation position offset from target.
     */
    baseOffset: Vector2,
};

type SnapSettings = {
    snappingSensitivity: number,
    snapToCorners: boolean,
    snapToCenter: boolean,
}

function getSnapSettings(item: Item | null, measurement: GridMeasurement, gridType: GridType) {
    const snappingSensitivity = measurement === 'EUCLIDEAN' ? 0 : 1;
    if (item && isImage(item) && gridType === 'SQUARE') {
        const itemSizeInGridUnits = Math.max(item.image.width * item.scale.x, item.image.height * item.scale.y) / item.grid.dpi;
        const sizeIsOdd = (Math.round(itemSizeInGridUnits) & 1) === 1;
        return { snappingSensitivity, snapToCorners: !sizeIsOdd, snapToCenter: sizeIsOdd };
    }
    return { snappingSensitivity, snapToCorners: false, snapToCenter: true };
}

async function snap(position: Vector2, snapSettings: SnapSettings) {
    return OBR.scene.grid.snapPosition(position, snapSettings.snappingSensitivity, snapSettings.snapToCorners, snapSettings.snapToCenter);
}

function getMeasurementText(numGridUnits: number, scale: GridScale) {
    return `${Math.round(numGridUnits * scale.parsed.multiplier).toString()}${scale.parsed.unit}`
}

function getRulerText(numGridUnits: number, scale: GridScale, scalingFactor: number) {
    const xFactorText = scalingFactor === 1 ? '' : `x${scalingFactor}`;
    return `${Math.round(numGridUnits * scale.parsed.multiplier)}${xFactorText}${scale.parsed.unit}`;
}

async function getSweeps(target: Item) {
    const emanations = await getEmanations(target.id, OBR.scene.items);
    const existingSweeps: SequenceSweep[] = (await OBR.scene.items.getItems(belongsToSequenceForTarget(target.id)))
        .filter(isSequenceSweep);
    const sweeps = await Promise.all(emanations.map((emanation) => getOrCreateSweep(target, emanation, existingSweeps)));
    const sweepData: SweepData[] = [];
    for (let i = 0; i < emanations.length; i++) {
        sweepData.push({
            sweeper: getSweeper(emanations[i]),
            baseCommands: sweeps[i].commands,
            baseOffset: Math2.subtract(emanations[i].position, target.position),
        });
    }
    return { sweeps, sweepData };
}

export default class DragState {
    private readonly start: Vector2;
    private end: Vector2;
    private readonly sweepData: SweepData[];
    private readonly interaction: AbstractInteraction<Item[]>;
    private readonly snapSettings: SnapSettings;
    private readonly distanceScaling: number;
    /**
     * Distance the target has traveled before the current drag.
     */
    private readonly baseDistance: number;
    /**
     * Whether the target was created just for this drag (e.g it's a marker for a measurement).
     */
    private readonly targetIsNew: boolean;

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
    ): Promise<DragState | null> {
        const [measurement, gridType, dpi, playerColor] = await Promise.all([
            OBR.scene.grid.getMeasurement(),
            OBR.scene.grid.getType(),
            OBR.scene.grid.getDpi(),
            OBR.player.getColor(),
        ]);

        const snapSettings = getSnapSettings(targetArg, measurement, gridType);
        const layer = aboveCharacters ? 'RULER' : 'DRAWING';

        let target: Item;
        let targetIsNew = targetArg === null;
        if (targetArg === null) {
            target = createDragMarker(
                await snap(pointerPosition, snapSettings),
                dpi,
                playerColor,
                layer,
                privateMode,
            );
        } else {
            target = targetArg;
        }

        const { sweeps, sweepData } = await getSweeps(target);
        const end = await snap(pointerPosition, snapSettings);
        const ruler = createSegment(target, end, layer, distanceScaling);
        const waypoint = createWaypoint(target, layer, dpi, playerColor);
        const label = createWaypointLabel(target);

        const interactionItems = DragState.composeItems({ target, sweeps, ruler, label, waypoint });
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
            snapSettings,
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
        snapSettings: SnapSettings,
        targetIsNew: boolean,
    ) {
        this.start = start;
        this.baseDistance = baseDistance;
        this.distanceScaling = distanceScaling;
        this.interaction = interaction;
        this.snapSettings = snapSettings;
        this.targetIsNew = targetIsNew;
        this.sweepData = sweepData;
        this.end = end; // make compiler happy that we're assigning this
        this.setEnd(end); // snap initial end
    }

    /**
     * Set endpoint, snapping to grid.
     * @param end Non-snapped endpoint
     * @returns Whether the endpoint changed.
     */
    private async setEnd(end: Vector2) {
        const oldEnd = this.end;
        this.end = await snap(end, this.snapSettings);
        return oldEnd.x != this.end.x || oldEnd.y != this.end.y;
    }

    private static composeItems({ target, sweeps, ruler, label, waypoint }: ReturnType<typeof DragState.prototype.decomposeItems>): Item[] {
        // For some reason OBR wants existing items first in the interaction array, then newly created ones.
        // It doesn't display updates to the existing items if existing items are at the back.
        return [target, ...sweeps, ruler, label, waypoint];
    }

    /**
     * Break down the misc items in an interaction.
     * @param items Misc items
     * @returns object that labels items
     */
    private decomposeItems(items: Item[]) {
        let idx = 0;
        const target = items[idx++];

        const numSweeps = this.sweepData.length;
        const sweeps = items.slice(idx, idx += numSweeps) as SequenceSweep[];

        const ruler = items[idx++] as Segment;
        const label = items[idx++] as WaypointLabel;
        const waypoint = items[idx++] as Waypoint;
        return { target, sweeps, ruler, label, waypoint };
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
                const { target, sweeps, ruler, label } = this.decomposeItems(items);
                label.text = { ...label.text, plainText: getMeasurementText(totalDistance, scale) };
                label.position = this.end;

                ruler.endPosition = this.end;
                ruler.measurement = getRulerText(unadjustedNewDistance, scale, this.distanceScaling);

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

        const { target, ruler, label, sweeps, waypoint } = await this.update(pointerPosition);
        const toAdd: Item[] = [ruler, label, waypoint, ...sweeps];
        if (this.targetIsNew) {
            toAdd.push(target);
        }

        const { stopAndReAdd: stopAndReadd, itemApi } = this.interaction;
        await stopAndReadd(toAdd);

        if (!this.targetIsNew) {
            await itemApi.updateItems([target.id], ([target]) => {
                target.position = this.end; // Work around bug where positions aren't updated
                target.metadata[METADATA_KEY] = createSequenceTargetMetadata();
            });
        }
    }

    async cancel() {
        const { update, stopAndReAdd: stopAndReadd } = this.interaction;
        // Fix bug where token is not locally displayed at its initial position on cancel
        await update((items) => {
            const { target } = this.decomposeItems(items);
            target.position = this.start;
        });
        await stopAndReadd([]);
    }
}