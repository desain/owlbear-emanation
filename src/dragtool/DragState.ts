import OBR, { GridMeasurement, GridScale, InteractionManager, Item, Label, Math2, Path, PathCommand, Ruler, Shape, Vector2, buildLabel, buildRuler, buildShape } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "./dragtoolTypes";
import { buildSequenceItem, createDragMarker, createSequenceItemMetadata, createSequenceTargetMetadata, getEmanations, getOrCreateSweeps, getSequenceLength } from "./sequenceutils";
import { Sweeper, getSweeper } from "./sweepUtils";

export function getSnappingSensitivity(measurement: GridMeasurement) {
    return measurement === 'EUCLIDEAN' ? 0 : 1;
}

function getMeasurementText(numGridUnits: number, scale: GridScale) {
    return `${Math.round(numGridUnits * scale.parsed.multiplier).toString()}${scale.parsed.unit}`
}

export default class DragState {
    private readonly start: Vector2;
    private end: Vector2;
    private readonly baseCommands: PathCommand[][];
    private readonly sweepers: Sweeper[];
    private readonly interaction: InteractionManager<Item[]>;
    private readonly snappingSensitivity: number;
    private readonly baseDistance: number;
    private readonly targetIsNew: boolean;

    static async createDrag(target: Item | null, pointerPosition: Vector2): Promise<DragState | null> {
        const [measurement, dpi, playerColor, emanations] = await Promise.all([
            OBR.scene.grid.getMeasurement(),
            OBR.scene.grid.getDpi(),
            OBR.player.getColor(),
            getEmanations(target?.id)
        ]);
        const snappingSensitivity = getSnappingSensitivity(measurement);
        const markerStrokeWidth = dpi / 20;

        let targetIsNew = target === null;
        if (target === null) {
            target = createDragMarker(
                await OBR.scene.grid.snapPosition(pointerPosition, snappingSensitivity),
                dpi,
                playerColor,
                markerStrokeWidth,
            );
        }

        const sweepers = emanations.map((emanation) => getSweeper(emanation));
        const sweeps = await getOrCreateSweeps(target, emanations);
        const end = await OBR.scene.grid.snapPosition(pointerPosition, snappingSensitivity);
        const ruler: Ruler = buildSequenceItem(target, createSequenceItemMetadata(target.id), buildRuler()
            .startPosition(target.position)
            .endPosition(end)
            .variant('DASHED')
        );
        const label: Label = buildSequenceItem(target, createSequenceItemMetadata(target.id), buildLabel()
            .position(target.position)
            .backgroundColor('black')
            .backgroundOpacity(0.6)
            .pointerDirection('DOWN')
            .pointerWidth(20)
            .pointerHeight(20)
        );
        const waypoint: Shape = buildSequenceItem(target, createSequenceItemMetadata(target.id), buildShape()
            .shapeType('CIRCLE')
            .position(target.position)
            .width(dpi / 4)
            .height(dpi / 4)
            .fillColor(playerColor)
            .strokeColor('gray')
            .strokeWidth(markerStrokeWidth)
        );
        const baseCommands = sweeps.map((sweep) => sweep.commands);

        return new DragState(
            target.position,
            end,
            await getSequenceLength(target.id),
            // For some reason OBR wants existing items first in the interaction array, then newly created ones.
            // It doesn't display updates to the existing items if existing items are at the back.
            await OBR.interaction.startItemInteraction([target, ...sweeps, ruler, label, waypoint]),
            baseCommands,
            sweepers,
            snappingSensitivity,
            targetIsNew,
        );
    }

    private constructor(
        start: Vector2,
        end: Vector2,
        baseDistance: number,
        interaction: InteractionManager<Item[]>,
        baseCommands: PathCommand[][],
        sweepers: Sweeper[],
        snappingSensitivity: number,
        targetIsNew: boolean,
    ) {
        this.start = start;
        this.baseDistance = baseDistance;
        this.interaction = interaction;
        this.snappingSensitivity = snappingSensitivity;
        this.baseCommands = baseCommands;
        this.targetIsNew = targetIsNew;
        this.sweepers = sweepers;
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

    /**
     * Break down the misc items in an interaction.
     * @param items Misc items
     * @returns object that labels items
     */
    private decomposeItems(items: Item[]) {
        let idx = 0;
        const target = items[idx++];

        const numSweeps = this.sweepers.length;
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
        const [update] = this.interaction;
        const items = update((items) => {
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
                    const sweepCommands = this.sweepers[i](this.start, movementVector);
                    sweep.commands = [...this.baseCommands[i], ...sweepCommands];
                }
            }
        });
        return this.decomposeItems(items);
    }

    async finish(pointerPosition: Vector2) {
        const { target, ruler, label, sweeps, waypoint } = await this.update(pointerPosition);

        const [_update, stop] = this.interaction;
        stop();

        if (this.start.x === this.end.x && this.start.y === this.end.y) {
            return;
        }

        const toAdd: Item[] = [ruler, label, waypoint, ...sweeps];
        if (this.targetIsNew) {
            toAdd.push(target);
        }
        await OBR.scene.items.addItems(toAdd);
        if (!this.targetIsNew) {
            await OBR.scene.items.updateItems([target.id], ([target]) => {
                target.position = this.end; // Work around bug where positions aren't updated
                target.metadata[METADATA_KEY] = createSequenceTargetMetadata();
            });
        }
    }

    cancel() {
        const [update, stop] = this.interaction;
        // Fix bug where token is not locally displayed at its initial position on cancel
        update((items) => {
            const { target } = this.decomposeItems(items);
            target.position = this.start;
        });
        stop();
    }
}