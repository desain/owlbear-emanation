import OBR, { buildLabel, buildPath, buildRuler, GridScale, InteractionManager, isImage, isPath, isRuler, Item, Label, Math2, Path, PathCommand, Ruler, Vector2 } from "@owlbear-rodeo/sdk";
import check from "./check.svg";
import icon from "./dragtool.svg";
import { Emanation, isEmanation } from "./helpers";
import { getSweeper, Sweeper } from "./sweepUtils";

/** Get the reverse domain name id for this plugin at a given path */
export function getPluginId(path: string) {
    return `com.desain.dragtool/${path}`;
}
const TOOL_ID = getPluginId('tool');
const METADATA_KEY = getPluginId('metadata');

type ToolMetadata = {
    activeSequenceId: string,
    itemId: string,
    emanationToSweeps: Record<string, string>, // TODO put emanation id in sweep meta
}

type ItemMetadata = {
    sequenceId: string,
}

function belongsToSequence(activeSequenceId: string): (item: Item) => boolean {
    return (item) => {
        const metadata = item.metadata[getPluginId("metadata")] as ItemMetadata | undefined;
        return metadata?.sequenceId === activeSequenceId;
    }
}

function createItemMetadata(sequenceId: string): ItemMetadata {
    return { sequenceId };
}

async function clearSequence(toolMetadata: ToolMetadata | null) {
    if (toolMetadata) {
        const ids = (await OBR.scene.items.getItems(belongsToSequence(toolMetadata.activeSequenceId)))
            .map((item) => item.id);
        await OBR.scene.items.deleteItems(ids);
    }
}

async function getEmanations(id: string): Promise<Emanation[]> {
    return (await OBR.scene.items.getItemAttachments([id])).filter(isEmanation);
}

function getMeasurementText(numGridUnits: number, scale: GridScale) {
    return `${Math.round(numGridUnits * scale.parsed.multiplier).toString()}${scale.parsed.unit}`
}

async function getOrCreateSweeps(toolMetadata: ToolMetadata, emanations: Emanation[]): Promise<Path[]> {
    const sweeps = [];
    for (const emanation of emanations) {
        let existingCommands: PathCommand[] = [];
        const existingSweepId = toolMetadata.emanationToSweeps[emanation.id];
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
            .metadata({ [METADATA_KEY]: createItemMetadata(toolMetadata.activeSequenceId) })
            .build();
        toolMetadata.emanationToSweeps[emanation.id] = sweep.id;
        sweeps.push(sweep);
    }
    return sweeps;
}

class DragState {
    start: Vector2;
    end: Vector2;
    baseCommands: PathCommand[][];
    sweepers: Sweeper[];
    interaction: InteractionManager<Item[]>;
    snappingSensitivity: number;
    baseDistance: number;

    static async create(target: Item, toolMetadata: ToolMetadata, pointerPosition: Vector2, baseDistance: number): Promise<DragState | null> {
        const [measurement, emanations] = await Promise.all([
            OBR.scene.grid.getMeasurement(),
            getEmanations(target.id)
        ]);
        const sweepers = emanations.map((emanation) => getSweeper(emanation));
        const sweeps = await getOrCreateSweeps(toolMetadata, emanations);
        const snappingSensitivity = measurement === 'EUCLIDEAN' ? 0 : 1;
        const end = await OBR.scene.grid.snapPosition(pointerPosition, snappingSensitivity);
        const ruler = buildRuler()
            .startPosition(target.position)
            .endPosition(end)
            .variant('DASHED')
            .layer('PROP')
            .disableHit(true)
            .locked(true)
            .metadata({ [METADATA_KEY]: createItemMetadata(toolMetadata.activeSequenceId) })
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
            .metadata({ [METADATA_KEY]: createItemMetadata(toolMetadata.activeSequenceId) })
            .build();
        const baseCommands = sweeps.map((sweep) => sweep.commands);

        return new DragState(
            target.position,
            end,
            baseDistance,
            // For some reason OBR wants existing items first in the interaction array, then newly created ones.
            // It doesn't display updates to the existing items if existing items are at the back.
            await OBR.interaction.startItemInteraction([target, ...sweeps, ruler, label]),
            baseCommands,
            sweepers,
            snappingSensitivity,
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
    ) {
        this.start = start;
        this.baseDistance = baseDistance;
        this.interaction = interaction;
        this.snappingSensitivity = snappingSensitivity;
        this.baseCommands = baseCommands;
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

    async finalize(pointerPosition: Vector2) {
        const { target, ruler, label, sweeps } = await this.update(pointerPosition);

        const [_update, stop] = this.interaction;
        stop();

        if (this.start.x != this.end.x || this.start.y != this.end.y) {
            await Promise.all([
                OBR.scene.items.updateItems([target.id], ([target]) => {
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
    let toolMetadata: ToolMetadata | null = null;

    OBR.tool.createMode({
        id: getPluginId('tool-mode'),
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
            let sequenceId: string;
            if (toolMetadata && toolMetadata.itemId === event.target.id) {
                sequenceId = toolMetadata.activeSequenceId;
            } else {
                await clearSequence(toolMetadata);
                sequenceId = crypto.randomUUID();
                toolMetadata = {
                    activeSequenceId: sequenceId,
                    itemId: event.target.id,
                    emanationToSweeps: {},
                };
            }

            const baseDistance = (await Promise.all(
                (await OBR.scene.items.getItems(isRuler))
                    .filter(belongsToSequence(sequenceId))
                    .map((ruler) => OBR.scene.grid.getDistance(ruler.startPosition, ruler.endPosition))
            )).reduce((a, b) => a + b, 0);

            dragState = await DragState.create(event.target, toolMetadata, event.pointerPosition, baseDistance);
        },
        async onToolDragMove(_, event) {
            await dragState?.update(event.pointerPosition);
        },
        async onToolDragEnd(_, event) {
            await dragState?.finalize(event.pointerPosition);
            dragState = null;
        },
        onToolDragCancel() {
            dragState?.cancel();
            dragState = null;
        },
        async onDeactivate(_context) {
            await clearSequence(toolMetadata);
            toolMetadata = null;
        },
    });

    OBR.tool.createAction({
        id: getPluginId('tool-action-finish'),
        icons: [{
            icon: check,
            label: "Finish Drag",
            filter: {
                activeTools: [TOOL_ID],
            },
        }],
        async onClick(_context) {
            await clearSequence(toolMetadata);
            toolMetadata = null;
        },
    });
}