import OBR, { buildLabel, buildPath, buildRuler, GridScale, InteractionManager, isImage, isPath, isRuler, Item, Label, Math2, Metadata, Path, PathCommand, Ruler, Vector2 } from "@owlbear-rodeo/sdk";
import check from "./check.svg";
import icon from "./dragtool.svg";
import { Emanation, isEmanation } from "./helpers";
import { getSweeper, Sweeper } from "./sweepUtils";

const PLUGIN_ID = 'com.desain.dragtool';
const TOOL_ID = `${PLUGIN_ID}/tool`;
const METADATA_KEY = `${PLUGIN_ID}/metadata`;

type SequenceItemMetadata = {
    type: 'SEQUENCE_ITEM',
    targetId: string,
    /**
     * Which emanation the item is attached to, if it's attached to one (e.g it's a sweep).
     */
    emanationId?: string,
}

type SequenceTargetMetadata = {
    type: 'SEQUENCE_TARGET',
    playerId: string,
}

type SequenceItem = Item & {
    metadata: Metadata & {
        [METADATA_KEY]: SequenceItemMetadata,
    },
}

type SequenceTarget = Item & {
    metadata: Metadata & {
        [METADATA_KEY]: SequenceTargetMetadata,
    },
}

function isSequenceItem(item: Item): item is SequenceItem {
    const metadata = item.metadata[METADATA_KEY];
    return typeof metadata === 'object'
        && metadata !== null
        && 'type' in metadata
        && metadata.type === 'SEQUENCE_ITEM';
}

function isSequenceTarget(item: Item): item is SequenceTarget {
    const metadata = item.metadata[METADATA_KEY];
    return typeof metadata === 'object'
        && metadata !== null
        && 'type' in metadata
        && metadata.type === 'SEQUENCE_TARGET'
}

function createSequenceItemMetadata(targetId: string, emanationId: string | undefined = undefined): SequenceItemMetadata {
    return { type: 'SEQUENCE_ITEM', targetId, emanationId };
}

function createSequenceTargetMetadata(): SequenceTargetMetadata {
    return { type: 'SEQUENCE_TARGET', playerId: OBR.player.id };
}

function belongsToSequenceForTarget(targetId: string): (item: Item) => item is SequenceItem {
    return (item): item is SequenceItem => isSequenceItem(item) && item.metadata[METADATA_KEY].targetId === targetId;
}

async function getEmanations(id: string): Promise<Emanation[]> {
    return (await OBR.scene.items.getItemAttachments([id])).filter(isEmanation);
}

function getMeasurementText(numGridUnits: number, scale: GridScale) {
    return `${Math.round(numGridUnits * scale.parsed.multiplier).toString()}${scale.parsed.unit}`
}

function itemMovedOutsideItsSequence(item: Item, items: Item[]): boolean {
    const rulers = items.filter(belongsToSequenceForTarget(item.id))
        .filter(isRuler) as (SequenceItem & Ruler)[]; // Typescript can't figure out that isRuler guarantees ruler here for some reason
    const previousPositions: Vector2[] = rulers.flatMap((ruler) => [ruler.startPosition, ruler.endPosition]);
    for (const position of previousPositions) {
        if (Math2.compare(item.position, position, 0.01)) {
            return false;
        }
    }
    return true;
}

async function deleteSequence(targetId: string) {
    console.log('deleting', targetId);
    const ids = (await OBR.scene.items.getItems(belongsToSequenceForTarget(targetId)))
        .map((item) => item.id);
    await OBR.scene.items.updateItems([targetId], ([target]) => {
        target.metadata[METADATA_KEY] = {};
    });
    await OBR.scene.items.deleteItems(ids);
}

async function deleteAllSequencesForCurrentPlayer() {
    console.log('deleting all for current');
    const sequences = await OBR.scene.items.getItems(isSequenceTarget);
    for (const sequence of sequences) {
        if (sequence.metadata[METADATA_KEY].playerId === OBR.player.id) {
            await deleteSequence(sequence.id);
        }
    }
}

async function getSequenceLength(targetId: string) {
    return (await Promise.all(
        (await OBR.scene.items.getItems(isRuler))
            .filter(belongsToSequenceForTarget(targetId))
            .map((ruler) => OBR.scene.grid.getDistance(ruler.startPosition, ruler.endPosition))
    )).reduce((a, b) => a + b, 0);
}

async function getOrCreateSweeps(targetId: string, emanations: Emanation[]): Promise<Path[]> {
    const existingSweeps: (SequenceItem & Path)[] = (await OBR.scene.items.getItems(belongsToSequenceForTarget(targetId)))
        .filter(isPath) as (SequenceItem & Path)[];
    const sweeps: Path[] = [];
    for (const emanation of emanations) {
        const existingSweep = existingSweeps.find((sweep) => sweep.metadata[METADATA_KEY]?.emanationId === emanation.id);
        if (existingSweep) {
            sweeps.push(existingSweep);
        } else {
            const sweep = buildPath()
                .position({ x: 0, y: 0 })
                .commands([])
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
                .metadata({ [METADATA_KEY]: createSequenceItemMetadata(targetId, emanation.id) })
                .build();
            sweeps.push(sweep);
        }
    }
    return sweeps;
}

class DragState {
    private readonly start: Vector2;
    private end: Vector2;
    private readonly baseCommands: PathCommand[][];
    private readonly sweepers: Sweeper[];
    private readonly interaction: InteractionManager<Item[]>;
    private readonly snappingSensitivity: number;
    private readonly baseDistance: number;

    static async createDrag(target: Item, pointerPosition: Vector2): Promise<DragState | null> {
        const [measurement, emanations] = await Promise.all([
            OBR.scene.grid.getMeasurement(),
            getEmanations(target.id)
        ]);
        const sweepers = emanations.map((emanation) => getSweeper(emanation));
        const sweeps = await getOrCreateSweeps(target.id, emanations);
        const snappingSensitivity = measurement === 'EUCLIDEAN' ? 0 : 1;
        const end = await OBR.scene.grid.snapPosition(pointerPosition, snappingSensitivity);
        const ruler = buildRuler()
            .startPosition(target.position)
            .endPosition(end)
            .variant('DASHED')
            .layer('PROP')
            .disableHit(true)
            .locked(true)
            .metadata({ [METADATA_KEY]: createSequenceItemMetadata(target.id) })
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
            .metadata({ [METADATA_KEY]: createSequenceItemMetadata(target.id) })
            .build();
        const baseCommands = sweeps.map((sweep) => sweep.commands);

        return new DragState(
            target.position,
            end,
            await getSequenceLength(target.id),
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

    /**
     * Break down the misc items in an interaction.
     * @param items Misc items
     * @returns object that labels items
     */
    private decomposeItems(items: Item[]) {
        const numSweeps = this.sweepers.length;
        const sweeps = items.slice(0, numSweeps) as Path[];
        const ruler = items[numSweeps] as Ruler;
        const label = items[numSweeps + 1] as Label;
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
                const { sweeps, ruler, label } = this.decomposeItems(sweepsRulerLabel);
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
        return { target, ...this.decomposeItems(sweepsRulerLabel) };
    }

    async finish(pointerPosition: Vector2) {
        const { target, ruler, label, sweeps } = await this.update(pointerPosition);

        const [_update, stop] = this.interaction;
        stop();

        if (this.start.x != this.end.x || this.start.y != this.end.y) {
            await Promise.all([
                OBR.scene.items.updateItems([target.id], ([target]) => {
                    target.position = this.end; // Work around bug where positions aren't updated
                    target.metadata[METADATA_KEY] = createSequenceTargetMetadata();
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

            dragState = await DragState.createDrag(event.target, event.pointerPosition);
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
            console.log('tool deactivate', OBR.player.id);
            await deleteAllSequencesForCurrentPlayer();
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
            await deleteAllSequencesForCurrentPlayer();
        },
    });

    const unsubscribeFunctions = [];
    if (await OBR.player.getRole() === 'GM') {
        // Delete a player's sequence when they leave
        unsubscribeFunctions.push(OBR.party.onChange(async (players) => {
            const activePlayers = new Set(players.map((player) => player.id));
            activePlayers.add(OBR.player.id); // apparently the GM isn't in by default
            console.log('players', activePlayers, 'iam', OBR.player.id);
            const sequenceTargets = await OBR.scene.items.getItems(isSequenceTarget);
            for (const target of sequenceTargets) {
                if (!activePlayers.has(target.metadata[METADATA_KEY].playerId)) {
                    console.log('deleting ownerless target', target, 'owner not in', activePlayers);
                    deleteSequence(target.id);
                }
            }
        }));

        // Delete a sequence when an item moves sout of it
        unsubscribeFunctions.push(OBR.scene.items.onChange((items) => {
            const ownerlessItems = items.filter(isSequenceItem)
                .filter((item) => !items.find((potentialOwner) => item.metadata[METADATA_KEY].targetId === potentialOwner.id))
                .map((item) => item.id);
            console.log('deleting ownerless', ownerlessItems);
            OBR.scene.items.deleteItems(ownerlessItems);
            items.filter(isSequenceTarget).forEach((item) => {
                if (itemMovedOutsideItsSequence(item, items)) {
                    console.log('moved out', item.id);
                    deleteSequence(item.id)
                }
            });
        }));
    }
}