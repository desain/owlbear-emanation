import OBR, { GridMeasurement, GridScale, Item, Label, Math2, Path, PathCommand, Ruler, Shape, Vector2, buildLabel, buildRuler, buildShape, isPath } from "@owlbear-rodeo/sdk";
import { ItemApi, METADATA_KEY, SequenceItem } from "./dragtoolTypes";
import { belongsToSequenceForTarget, buildSequenceItem, createDragMarker, createSequenceTargetMetadata, getEmanations, getOrCreateSweep, getSequenceLength } from "./sequenceutils";
import { Sweeper, getSweeper } from "./sweepUtils";

const RULER_Z_INDEX = 0;
const WAYPOINT_Z_INDEX = 1;
const MARKER_Z_INDEX = 2;
const LABEL_Z_INDEX = 3;

export function getSnappingSensitivity(measurement: GridMeasurement) {
    return measurement === 'EUCLIDEAN' ? 0 : 1;
}

function getMeasurementText(numGridUnits: number, scale: GridScale) {
    return `${Math.round(numGridUnits * scale.parsed.multiplier).toString()}${scale.parsed.unit}`
}

/**
 * Type that abstracts over a network interaction or a local item interaction
 */
type AbstractInteraction<T> = {
    update(updater: (value: T) => void): Promise<T>,
    stopAndReAdd(toReAdd: T): Promise<void>,
    itemApi: ItemApi,
}

async function wrapRealInteraction(items: Item[]): Promise<AbstractInteraction<Item[]>> {
    const [update, stop] = await OBR.interaction.startItemInteraction(items);
    return {
        async update(updater: (_: Item[]) => void) {
            return update(updater);
        },
        async stopAndReAdd(items: Item[]) {
            stop();
            await OBR.scene.items.addItems(items);
        },
        itemApi: OBR.scene.items,
    };
}

async function localInteraction(items: Item[]): Promise<AbstractInteraction<Item[]>> {
    const ids = items.map((item) => item.id);
    const existingIds = (await OBR.scene.local.getItems(ids)).map((item) => item.id);
    const newItems = items.filter((item) => !existingIds.includes(item.id));
    await OBR.scene.local.addItems(newItems);
    return {
        update: async (updater: (_: Item[]) => void) => {
            OBR.scene.local.updateItems(ids, updater);
            return OBR.scene.local.getItems(ids);
        },
        async stopAndReAdd(items: Item[]) {
            const idsToKeep = items.map((item) => item.id);
            const toDelete = newItems
                .map((item) => item.id)
                .filter((id) => !idsToKeep.includes(id));
            await OBR.scene.local.deleteItems(toDelete);
        },
        itemApi: OBR.scene.local,
    };
}

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

export default class DragState {
    private readonly start: Vector2;
    private end: Vector2;
    private readonly sweepData: SweepData[];
    private readonly interaction: AbstractInteraction<Item[]>;
    private readonly snappingSensitivity: number;
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
        privateMode: boolean,
        aboveCharacters: boolean,
    ): Promise<DragState | null> {
        const [measurement, dpi, playerColor] = await Promise.all([
            OBR.scene.grid.getMeasurement(),
            OBR.scene.grid.getDpi(),
            OBR.player.getColor(),
        ]);
        const snappingSensitivity = getSnappingSensitivity(measurement);
        const markerStrokeWidth = dpi / 20;
        const layer = aboveCharacters ? 'RULER' : 'DRAWING';

        let target: Item;
        let targetIsNew = targetArg === null;
        if (targetArg === null) {
            target = createDragMarker(
                await OBR.scene.grid.snapPosition(pointerPosition, snappingSensitivity),
                dpi,
                playerColor,
                markerStrokeWidth,
                layer,
                MARKER_Z_INDEX,
                privateMode,
            );
        } else {
            target = targetArg;
        }


        const emanations = await getEmanations(target.id, OBR.scene.items);
        const existingSweeps: (SequenceItem & Path)[] = (await OBR.scene.items.getItems(belongsToSequenceForTarget(target.id)))
            .filter(isPath) as (SequenceItem & Path)[];
        const sweeps = await Promise.all(emanations.map((emanation) => getOrCreateSweep(target, emanation, existingSweeps)));
        const sweepData: SweepData[] = [];
        for (let i = 0; i < emanations.length; i++) {
            sweepData.push({
                sweeper: getSweeper(emanations[i]),
                baseCommands: sweeps[i].commands,
                baseOffset: Math2.subtract(emanations[i].position, target.position),
            });
            console.log(sweepData[i]);
        }

        const end = await OBR.scene.grid.snapPosition(pointerPosition, snappingSensitivity);
        const ruler: Ruler = buildSequenceItem(target, layer, RULER_Z_INDEX, buildRuler()
            .name(`Path Ruler for ${target.name}`)
            .startPosition(target.position)
            .endPosition(end)
            .variant('DASHED')
        );
        const waypoint: Shape = buildSequenceItem(target, layer, WAYPOINT_Z_INDEX, buildShape()
            .name(`Path Waypoint for ${target.name}`)
            .position(target.position)
            .shapeType('CIRCLE')
            .width(dpi / 4)
            .height(dpi / 4)
            .fillColor(playerColor)
            .strokeColor('gray')
            .strokeWidth(markerStrokeWidth)
        );
        // Labels always go above characters
        const label: Label = buildSequenceItem(target, 'RULER', LABEL_Z_INDEX, buildLabel()
            .name(`Path Label for ${target.name}`)
            .position(target.position)
            .backgroundColor('black')
            .backgroundOpacity(0.6)
            .pointerDirection('DOWN')
            .pointerWidth(20)
            .pointerHeight(40)
        );


        const interactionItems = DragState.composeItems({ target, sweeps, ruler, label, waypoint });
        const interaction: AbstractInteraction<Item[]> = privateMode
            ? await localInteraction(interactionItems)
            : await wrapRealInteraction(interactionItems);

        return new DragState(
            target.position,
            end,
            await getSequenceLength(target.id, interaction.itemApi),
            interaction,
            sweepData,
            snappingSensitivity,
            targetIsNew,
        );
    }

    private constructor(
        start: Vector2,
        end: Vector2,
        baseDistance: number,
        interaction: AbstractInteraction<Item[]>,
        sweepData: SweepData[],
        snappingSensitivity: number,
        targetIsNew: boolean,
    ) {
        this.start = start;
        this.baseDistance = baseDistance;
        this.interaction = interaction;
        this.snappingSensitivity = snappingSensitivity;
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
        this.end = await OBR.scene.grid.snapPosition(end, this.snappingSensitivity, false, true);
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
        const sweeps = items.slice(idx, idx += numSweeps) as Path[];

        const ruler = items[idx++] as Ruler;
        const label = items[idx++] as Label;
        const waypoint = items[idx++] as Shape;
        return { target, sweeps, ruler, label, waypoint };
    }

    async update(pointerPosition: Vector2) {
        const changedEnd = await this.setEnd(pointerPosition);
        const [newDistance, scale] = await Promise.all([
            OBR.scene.grid.getDistance(this.start, this.end),
            OBR.scene.grid.getScale(),
        ]);
        const totalDistance = this.baseDistance + newDistance;
        const { update } = this.interaction;
        const items = await update((items) => {
            if (changedEnd) {
                const { target, sweeps, ruler, label } = this.decomposeItems(items);
                label.text = { ...label.text, plainText: getMeasurementText(totalDistance, scale) };
                label.position = this.end;

                ruler.endPosition = this.end;
                ruler.measurement = getMeasurementText(newDistance, scale);

                target.position = this.end;

                const movementVector = Math2.subtract(this.end, this.start);
                for (let i = 0; i < sweeps.length; i++) {
                    const sweep = sweeps[i] as Path;
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