import OBR, { buildLabel, buildPath, buildRuler, GridScale, InteractionManager, isImage, isPath, isRuler, Item, Label, Math2, Metadata, Path, PathCommand, Ruler, Vector2 } from "@owlbear-rodeo/sdk";
import check from "./check.svg";
import icon from "./dragtool.svg";
import { Emanation, isEmanation } from "./helpers";
import { getSweeper, Sweeper } from "./sweepUtils";

const PLUGIN_ID = 'com.desain.dragtool';
const TOOL_ID = `${PLUGIN_ID}/tool`;
const METADATA_KEY = `${PLUGIN_ID}/metadata`;

type SequenceItem = Item & {
    metadata: Metadata & {
        [METADATA_KEY]: SequenceItemMetadata,
    },
}

type SequenceItemMetadata = {
    /**
     * Save sequence ID rather than target ID so if one person leaves a sequence, and another moves it with this tool,
     * the first owner's sequence can remove itself without removing the second person's sequence
     */
    sequenceId: string,
    /**
     * Save player ID to remove sequence items when a player leaves.
     */
    playerId: string,
}

function isSequenceItem(item: Item): item is SequenceItem {
    return item.metadata[METADATA_KEY] !== undefined;
}

function belongsToSequence(activeSequenceId: string): (item: Item) => boolean {
    return (item) => {
        const metadata = item.metadata[METADATA_KEY] as SequenceItemMetadata | undefined;
        return metadata?.sequenceId === activeSequenceId;
    }
}

function createItemMetadata(sequenceId: string): SequenceItemMetadata {
    return { sequenceId, playerId: OBR.player.id };
}

async function getEmanations(id: string): Promise<Emanation[]> {
    return (await OBR.scene.items.getItemAttachments([id])).filter(isEmanation);
}

function getMeasurementText(numGridUnits: number, scale: GridScale) {
    return `${Math.round(numGridUnits * scale.parsed.multiplier).toString()}${scale.parsed.unit}`
}

class Sequence {
    readonly id: string;
    readonly targetId: string;
    private readonly postDelete: () => void;
    private readonly unsubscribeWatch: () => void;
    private targetLastPositions: [Vector2, Vector2];
    private emanationToSweeps: Map<string, string>; // TODO put emanation id in sweep meta

    constructor(target: Item, postDelete: () => void) {
        this.id = crypto.randomUUID();
        this.targetId = target.id;
        this.targetLastPositions = [target.position, target.position];
        this.emanationToSweeps = new Map();
        this.postDelete = postDelete;
        // If someone else moves our item, the sequence is invalid, so delete it
        this.unsubscribeWatch = OBR.scene.items.onChange((items) => {
            items.filter((item) => item.id === this.targetId).forEach((item) => {
                if (this.itemHasMoved(item)) {
                    // console.log("Item moved", item.position, this.targetLastPositions);
                    this.delete();
                }
            });
        });
    }

    async delete() {
        this.unsubscribeWatch();
        const ids = (await OBR.scene.items.getItems(belongsToSequence(this.id)))
            .map((item) => item.id);
        await OBR.scene.items.deleteItems(ids);
        this.postDelete();
    }

    private async getLength() {
        return (await Promise.all(
            (await OBR.scene.items.getItems(isRuler))
                .filter(belongsToSequence(this.id))
                .map((ruler) => OBR.scene.grid.getDistance(ruler.startPosition, ruler.endPosition))
        )).reduce((a, b) => a + b, 0);
    }

    itemHasMoved(item: Item) {
        return !Math2.compare(item.position, this.targetLastPositions[0], 0.01)
            && !Math2.compare(item.position, this.targetLastPositions[1], 0.01);
    }

    updateTargetPosition(position: Vector2) {
        this.targetLastPositions = [this.targetLastPositions[1], position];
    }

    async getOrCreateSweeps(emanations: Emanation[]): Promise<Path[]> {
        const sweeps = [];
        for (const emanation of emanations) {
            let existingCommands: PathCommand[] = [];
            const existingSweepId = this.emanationToSweeps.get(emanation.id);
            if (existingSweepId) {
                const [sweepPath] = (await OBR.scene.items.getItems([existingSweepId])).filter(isPath);
                if (sweepPath) {
                    existingCommands = sweepPath.commands;
                    sweeps.push(sweepPath);
                    continue;
                }
            }
            const sweep = buildPath()
                .position({ x: 0, y: 0 })
                .commands(existingCommands)
                .strokeWidth(emanation.style.strokeWidth)
                .strokeColor(emanation.style.strokeColor)
                .strokeDash(emanation.style.strokeDash)
                .strokeOpacity(0)
                .fillColor(emanation.style.fillColor)
                .fillOpacity(emanation.style.fillOpacity)
                .layer('DRAWING')
                .fillRule('nonzero')
                .disableHit(true)
                .locked(true)
                .metadata({ [METADATA_KEY]: createItemMetadata(this.id) })
                .build();
            this.emanationToSweeps.set(emanation.id, sweep.id);
            sweeps.push(sweep);
        }
        return sweeps;
    }

    async createDrag(target: Item, pointerPosition: Vector2): Promise<DragState | null> {
        if (this.targetId !== target.id) {
            return null;
        }
        const [measurement, emanations] = await Promise.all([
            OBR.scene.grid.getMeasurement(),
            getEmanations(target.id)
        ]);
        const sweepers = emanations.map((emanation) => getSweeper(emanation));
        const sweeps = await this.getOrCreateSweeps(emanations);
        const snappingSensitivity = measurement === 'EUCLIDEAN' ? 0 : 1;
        const end = await OBR.scene.grid.snapPosition(pointerPosition, snappingSensitivity);
        const ruler = buildRuler()
            .startPosition(target.position)
            .endPosition(end)
            .variant('DASHED')
            .layer('PROP')
            .disableHit(true)
            .locked(true)
            .metadata({ [METADATA_KEY]: createItemMetadata(this.id) })
            .build();
        const label = buildLabel()
            .position(target.position)
            .backgroundColor('black')
            .backgroundOpacity(0.6)
            .pointerDirection('DOWN')
            .pointerWidth(20)
            .pointerHeight(10)
            .disableHit(true)
            .locked(true)
            .metadata({ [METADATA_KEY]: createItemMetadata(this.id) })
            .build();
        const baseCommands = sweeps.map((sweep) => sweep.commands);

        return new DragState(
            target.position,
            end,
            await this.getLength(),
            // For some reason OBR wants existing items first in the interaction array, then newly created ones.
            // It doesn't display updates to the existing items if existing items are at the back.
            await OBR.interaction.startItemInteraction([target, ...sweeps, ruler, label]),
            baseCommands,
            sweepers,
            snappingSensitivity,
            (finalPosition) => this.updateTargetPosition(finalPosition),
        );
    }
}

class DragState {
    private readonly start: Vector2;
    private end: Vector2;
    private readonly baseCommands: PathCommand[][];
    private readonly sweepers: Sweeper[];
    private readonly interaction: InteractionManager<Item[]>;
    private readonly snappingSensitivity: number;
    private readonly baseDistance: number;
    private readonly reportFinalPosition: (finalPosition: Readonly<Vector2>) => void;

    constructor(
        start: Vector2,
        end: Vector2,
        baseDistance: number,
        interaction: InteractionManager<Item[]>,
        baseCommands: PathCommand[][],
        sweepers: Sweeper[],
        snappingSensitivity: number,
        reportFinalPosition: (finalPosition: Vector2) => void,
    ) {
        this.start = start;
        this.baseDistance = baseDistance;
        this.interaction = interaction;
        this.snappingSensitivity = snappingSensitivity;
        this.baseCommands = baseCommands;
        this.sweepers = sweepers;
        this.end = end; // make compiler happy that we're assigning this
        this.reportFinalPosition = reportFinalPosition;
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

    private getSweepsRulerLabel(sweepsRulerLabel: Item[]) {
        const numSweeps = this.sweepers.length;
        const sweeps = sweepsRulerLabel.slice(0, numSweeps) as Path[];
        const ruler = sweepsRulerLabel[numSweeps] as Ruler;
        const label = sweepsRulerLabel[numSweeps + 1] as Label;
        return { sweeps, ruler, label };
    }

    async update(pointerPosition: Vector2) {
        const changedEnd = await this.setEnd(pointerPosition);
        const [newDistance, scale] = await Promise.all([
            OBR.scene.grid.getDistance(this.start, this.end),
            OBR.scene.grid.getScale(),
        ]);
        const totalDistance = this.baseDistance + newDistance;
        const [update] = this.interaction;
        const [target, ...sweepsRulerLabel] = update(([target, ...sweepsRulerLabel]) => {
            if (changedEnd) {
                const { sweeps, ruler, label } = this.getSweepsRulerLabel(sweepsRulerLabel);
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
        return { target, ...this.getSweepsRulerLabel(sweepsRulerLabel) };
    }

    async finish(pointerPosition: Vector2) {
        const { target, ruler, label, sweeps } = await this.update(pointerPosition);

        const [_update, stop] = this.interaction;
        stop();

        if (this.start.x != this.end.x || this.start.y != this.end.y) {
            await Promise.all([
                OBR.scene.items.updateItems([target.id], ([target]) => {
                    this.reportFinalPosition(this.end);
                    target.position = this.end;
                }),
                OBR.scene.items.addItems([ruler, label, ...sweeps]),
            ]);
        }
    }

    cancel() {
        const [update, stop] = this.interaction;
        // Fix bug where token is not locally displayed at its initial position on cancel
        update(([target, _sweepsRulerLabel]) => {
            target.position = this.start;
        });
        stop();
    }
}

export async function installTool() {
    OBR.tool.create({
        id: TOOL_ID,
        icons: [{
            icon,
            label: "Drag path",
        }],
        shortcut: 'Z',
    });

    let dragState: DragState | null = null;
    let sequence: Sequence | null = null;

    OBR.tool.createMode({
        id: `${PLUGIN_ID}/drag-mode`,
        shortcut: 'Z',
        icons: [{
            icon,
            label: 'Drag',
            filter: {
                activeTools: [TOOL_ID],
            },
        }],
        preventDrag: {
            target: [
                {
                    key: 'type',
                    operator: '!=',
                    value: 'IMAGE',
                    coordinator: '||'
                },
                {
                    key: 'layer',
                    operator: '!=',
                    value: 'CHARACTER',
                }
            ],
        },
        cursors: [
            {
                cursor: 'grabbing',
                filter: {
                    dragging: true,
                }
            },
            {
                cursor: 'grab',
                filter: {
                    target: [
                        {
                            key: 'type',
                            value: 'IMAGE',
                            coordinator: '&&'
                        },
                        {
                            key: 'layer',
                            value: 'CHARACTER',
                        }
                    ],
                }
            },
            {
                cursor: 'move',
            },
        ],
        async onToolDragStart(_context, event) {
            if (!event.target || !isImage(event.target) || event.target.layer !== 'CHARACTER' || dragState != null) {
                return;
            }
            if (!sequence || sequence.targetId !== event.target.id) {
                await sequence?.delete();
                sequence = new Sequence(event.target, () => sequence = null);
            }

            dragState = await sequence.createDrag(event.target, event.pointerPosition);
        },
        async onToolDragMove(_, event) {
            await dragState?.update(event.pointerPosition);
        },
        async onToolDragEnd(_, event) {
            await dragState?.finish(event.pointerPosition);
            dragState = null;
        },
        onToolDragCancel() {
            dragState?.cancel();
            dragState = null;
        },
        async onDeactivate(_context) {
            await sequence?.delete();
        },
    });

    OBR.tool.createAction({
        id: `${PLUGIN_ID}/tool-action-finish`,
        shortcut: 'Enter',
        icons: [{
            icon: check,
            label: "Finish Drag",
            filter: {
                activeTools: [TOOL_ID],
            },
        }],
        async onClick(_context) {
            await sequence?.delete();
            sequence = null;
        },
    });

    // Delete a player's sequence when they leave
    if (await OBR.player.getRole() === 'GM') {
        OBR.party.onChange(async (players) => {
            const activePlayers = new Set(players.map((player) => player.id));
            const toDelete = [];
            const sequenceItems = await OBR.scene.items.getItems(isSequenceItem);
            for (const item of sequenceItems) {
                if (!activePlayers.has(item.metadata[METADATA_KEY].playerId)) {
                    toDelete.push(item.id);
                }
            }
            await OBR.scene.items.deleteItems(toDelete);
        })
    }
}