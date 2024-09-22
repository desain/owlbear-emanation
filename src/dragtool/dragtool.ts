import OBR, { Item, Player, Vector2 } from "@owlbear-rodeo/sdk";
import check from "./check.svg";
import DragState from "./DragState";
import icon from "./dragtool.svg";
import { isSequenceItem, isSequenceTarget, ItemApi, METADATA_KEY, PLUGIN_ID, TOOL_ID } from "./dragtoolTypes";
import { withBothItemApis } from "./interactionUtils";
import { deleteAllSequencesForCurrentPlayer, deleteSequence, DRAG_MARKER_FILTER, DRAGGABLE_ITEM_FILTER, isDraggableItem, isIndependentDragMarker, itemMovedOutsideItsSequence, NOT_DRAGGABLE_ITEM_FILTER } from "./sequenceUtils";

function createDragMode() {
    let dragState: DragState | null = null;
    OBR.tool.createMode({
        id: `${PLUGIN_ID}/drag-item-mode`,
        shortcut: 'G',
        icons: [
            {
                icon,
                label: 'Move Character',
                filter: {
                    activeTools: [TOOL_ID],
                },
            }
        ],
        preventDrag: {
            target: NOT_DRAGGABLE_ITEM_FILTER,
        },
        cursors: [
            {
                cursor: 'grabbing',
                filter: {
                    dragging: true,
                    target: DRAGGABLE_ITEM_FILTER,
                }
            },
            {
                cursor: 'grab',
                filter: {
                    target: DRAGGABLE_ITEM_FILTER,
                }
            },
            {
                cursor: 'move',
            },
        ],
        async onToolDragStart(_context, event) {
            if (!isDraggableItem(event.target) || dragState != null) {
                return;
            }

            dragState = await DragState.createDrag(event.target, event.pointerPosition, false, false);
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
            if (isDraggableItem(event.target, false)) {
                return true;
            } else {
                await deleteAllSequencesForCurrentPlayer();
                return false;
            }
        },
        async onDeactivate() {
            // console.log('tool deactivate', OBR.player.id);
            await deleteAllSequencesForCurrentPlayer();
        },
    });
}

function createMeasureMode(privateMode: boolean) {
    let dragState: DragState | null = null;
    OBR.tool.createMode({
        id: `${PLUGIN_ID}/measure-path-mode${privateMode ? '-private' : ''}`,
        shortcut: privateMode ? 'X' : 'Z',
        icons: [
            {
                icon,
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
        async onToolDragStart(_context, event) {
            if (dragState != null) {
                return;
            }
            let startPosition: Vector2;
            let target: Item | null;
            if (isIndependentDragMarker(event.target)) {
                startPosition = event.target.position;
                target = event.target;
            } else if (isDraggableItem(event.target)) {
                startPosition = event.target.position;
                target = null;
            } else {
                startPosition = event.pointerPosition;
                target = null;
            }

            dragState = await DragState.createDrag(target, startPosition, privateMode, true);
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
            if (isIndependentDragMarker(event.target)) {
                return true;
            } else {
                await deleteAllSequencesForCurrentPlayer();
                return false;
            }
        },
        async onDeactivate(_context) {
            // console.log('tool deactivate', OBR.player.id);
            await deleteAllSequencesForCurrentPlayer();
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
    // Remove sequence items whose target was removed
    const ownerlessItems = items.filter(isSequenceItem)
        .filter((item) => !items.find((potentialOwner) => item.metadata[METADATA_KEY].targetId === potentialOwner.id))
        .map((item) => item.id);
    // console.log('deleting ownerless', ownerlessItems);
    api.deleteItems(ownerlessItems);
    // Remove sequence items whose target was moved
    items.filter(isSequenceTarget).forEach((item) => {
        if (itemMovedOutsideItsSequence(item, items)) {
            console.log('item moved out of its sequence', item.id, 'items are', items);
            deleteSequence(item, api)
        }
    });
}

function createFinishAction() {
    OBR.tool.createAction({
        id: `${PLUGIN_ID} /tool-action-finish`,
        shortcut: 'Enter',
        icons: [{
            icon: check,
            label: "Finish Drag",
            filter: {
                activeTools: [TOOL_ID],
            },
        }],
        onClick: deleteAllSequencesForCurrentPlayer,
    });
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

    createDragMode();
    createMeasureMode(false);
    createMeasureMode(true);
    createFinishAction();

    const unsubscribeFunctions = [];
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
    // TODO on scene ready change to not ready call unsubscribe?
}