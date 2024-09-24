import OBR, { Item, Player, Vector2 } from "@owlbear-rodeo/sdk";
import icon1x from "../assets/1x.svg";
import icon2x from "../assets/2x.svg";
import clear from "../assets/clear.svg";
import ruler from "../assets/ruler.svg";
import rulerPrivate from "../assets/rulerPrivate.svg";
import walk from "../assets/walk.svg";
import { DRAG_MODE_ID, METADATA_KEY, PLUGIN_ID, TOOL_ID } from "./constants";
import { DRAGGABLE_CHARACTER_FILTER, DRAGGABLE_CHARACTER_FILTER_INVERSE, isDraggableCharacter } from "./DraggableCharacter.ts";
import DragState from "./DragState";
import { DragToolMetadata, setToolMetadata } from "./DragToolMetadata.ts";
import { ItemApi, withBothItemApis } from "./ItemApi";
import { DRAG_MARKER_FILTER, isDragMarker } from "./Sequence/DragMarker";
import { isSequenceTarget } from "./Sequence/SequenceTarget";
import { deleteAllSequencesForCurrentPlayer, deleteSequence, itemMovedOutsideItsSequence } from "./Sequence/utils.ts";

export default async function installDragTool() {
    const defaultMetadata: DragToolMetadata = { distanceScaling: 1 };
    OBR.tool.create({
        id: TOOL_ID,
        icons: [{
            icon: walk,
            label: "Drag path",
        }],
        shortcut: 'Z',
        defaultMetadata,
        defaultMode: DRAG_MODE_ID,
        async onClick() {
            await setToolMetadata({ distanceScaling: 1 });
            return true;
        },
    });

    const readAndClearScalingJustClicked = createChangeScalingAction();
    createDragMode(readAndClearScalingJustClicked);
    createMeasureMode(false, readAndClearScalingJustClicked);
    createMeasureMode(true, readAndClearScalingJustClicked);
    createClearAction();

    const unsubscribeFunctions: (() => void)[] = [];
    if (await OBR.player.getRole() === 'GM') {
        // Delete a player's sequence when they leave
        unsubscribeFunctions.push(OBR.party.onChange(deleteSequencesFromVanishedPlayers));

        // Delete a sequence when an item moves sout of it
        await withBothItemApis(async (api) => {
            unsubscribeFunctions.push(api.onChange((items) => {
                deleteInvalidatedSequences(items, api);
            }));
        });
    }
    return () => unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
}

function createDragMode(readAndClearScalingJustClicked: () => boolean) {
    let dragState: DragState | null = null;
    OBR.tool.createMode({
        id: DRAG_MODE_ID,
        shortcut: 'G',
        icons: [
            {
                icon: walk,
                label: 'Move Character',
                filter: {
                    activeTools: [TOOL_ID],
                },
            }
        ],
        preventDrag: {
            target: DRAGGABLE_CHARACTER_FILTER_INVERSE,
        },
        cursors: [
            {
                cursor: 'grabbing',
                filter: {
                    dragging: true,
                    target: DRAGGABLE_CHARACTER_FILTER,
                }
            },
            {
                cursor: 'grab',
                filter: {
                    target: DRAGGABLE_CHARACTER_FILTER,
                }
            },
            {
                cursor: 'move',
            },
        ],
        async onToolDragStart(context, event) {
            if (event.transformer || !isDraggableCharacter(event.target) || dragState != null) {
                return;
            }
            if (typeof context.metadata.distanceScaling !== 'number') {
                throw 'Invalid metadata';
            }

            dragState = await DragState.createDrag(
                event.target,
                event.pointerPosition,
                context.metadata.distanceScaling,
                false,
                false
            );
        },
        async onToolDragMove(_, event) {
            await dragState?.update(event.pointerPosition);
        },
        async onToolDragEnd(_, event) {
            await dragState?.finish(event.pointerPosition);
            dragState = null;
        },
        async onToolDragCancel() {
            await dragState?.cancel();
            dragState = null;
        },
        async onToolDoubleClick(_, event) {
            if (isDraggableCharacter(event.target, false)) {
                return true;
            } else {
                await deleteAllSequencesForCurrentPlayer();
                return false;
            }
        },
        async onDeactivate() {
            if (!readAndClearScalingJustClicked()) {
                await deleteAllSequencesForCurrentPlayer();
            }
        },
    });
}

function createMeasureMode(privateMode: boolean, readAndClearScalingJustClicked: () => boolean) {
    let dragState: DragState | null = null;
    OBR.tool.createMode({
        id: `${PLUGIN_ID}/measure-path-mode${privateMode ? '-private' : ''}`,
        shortcut: privateMode ? 'P' : 'R',
        icons: [
            {
                icon: privateMode ? rulerPrivate : ruler,
                label: `Measure Path${privateMode ? ' (Private)' : ''}`,
                filter: {
                    activeTools: [TOOL_ID],
                },
            }
        ],
        cursors: [
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
        ],
        async onToolDragStart(context, event) {
            if (dragState != null) {
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

            dragState = await DragState.createDrag(
                target,
                startPosition,
                context.metadata.distanceScaling,
                privateMode,
                true,
            );
        },
        async onToolDragMove(_, event) {
            await dragState?.update(event.pointerPosition);
        },
        async onToolDragEnd(_, event) {
            await dragState?.finish(event.pointerPosition);
            dragState = null;
        },
        async onToolDragCancel() {
            await dragState?.cancel();
            dragState = null;
        },
        async onToolDoubleClick(_, event) {
            if (isDragMarker(event.target)) {
                return true;
            } else {
                await deleteAllSequencesForCurrentPlayer();
                return false;
            }
        },
        async onDeactivate(_context) {
            if (!readAndClearScalingJustClicked()) {
                await deleteAllSequencesForCurrentPlayer();
            }
        },
    });
}

async function deleteSequencesFromVanishedPlayers(players: Player[]) {
    const activePlayers = new Set(players.map((player) => player.id));
    activePlayers.add(OBR.player.id); // apparently the GM isn't in by default
    // console.log('players', activePlayers, 'iam', OBR.player.id);
    await withBothItemApis(async (api) => {
        const sequenceTargets = await api.getItems(isSequenceTarget);
        for (const target of sequenceTargets) {
            if (!activePlayers.has(target.metadata[METADATA_KEY].playerId)) {
                // console.log('deleting sequence of ownerless target', target, 'owner not in', activePlayers);
                deleteSequence(target, api);
            }
        }
    });
}

async function deleteInvalidatedSequences(items: Item[], api: ItemApi) {
    // Remove sequence items whose target was moved
    items.filter(isSequenceTarget).forEach((item) => {
        if (itemMovedOutsideItsSequence(item, items)) {
            // console.log('item moved out of its sequence', item.id, 'items are', items);
            deleteSequence(item, api)
        }
    });
}

function createClearAction() {
    OBR.tool.createAction({
        id: `${PLUGIN_ID} /tool-action-clear`,
        shortcut: 'Enter',
        icons: [{
            icon: clear,
            label: "Clear Measurements",
            filter: {
                activeTools: [TOOL_ID],
            },
        }],
        async onClick() {
            await deleteAllSequencesForCurrentPlayer();
        },
    });
}

function createChangeScalingAction() {
    let scalingJustClicked = false;

    const distanceScaling: keyof DragToolMetadata = 'distanceScaling';
    OBR.tool.createAction({
        id: `${PLUGIN_ID} /tool-action-change-scaling`,
        shortcut: 'X',
        icons: [
            {
                icon: icon1x,
                label: "Change Scaling to 2x",
                filter: {
                    activeTools: [TOOL_ID],
                    metadata: [
                        {
                            key: distanceScaling,
                            value: 1,
                        },
                    ],
                },
            },
            {
                icon: icon2x,
                label: "Change Scaling to 1x",
                filter: {
                    activeTools: [TOOL_ID],
                },
            }
        ],
        async onClick(context) {
            scalingJustClicked = true;
            await setToolMetadata({ distanceScaling: context.metadata.distanceScaling === 1 ? 2 : 1 }); // deactivates tool
        },
    });

    return () => {
        const result = scalingJustClicked;
        scalingJustClicked = false;
        return result;
    };
}