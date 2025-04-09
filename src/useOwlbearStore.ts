import OBR, { Item, Metadata } from "@owlbear-rodeo/sdk";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { GridParams, GridParsed } from "./types/GridParsed";
import {
    DEFAULT_SCENE_METADATA,
    extractSceneMetadataOrDefault,
    SceneMetadata,
} from "./types/metadata/SceneMetadata";

type Role = Awaited<ReturnType<typeof OBR.player.getRole>>;

export interface OwlbearStore {
    role: Role;
    playerId: string;
    sceneMetadata: SceneMetadata;
    grid: GridParsed;
    selection: string[];
    /**
     * Items the user clicked 'edit auras' on.
     */
    editMenuClickedItems: string[];
    /**
     * Items that are either selected, or were selected when the user clicked 'edit auras'.
     */
    targetedItems: Item[];
    setRole: (role: Role) => void;
    setPlayerId: (playerId: string) => void;
    setSceneMetadata: (metadata: Metadata) => void;
    setGrid: (grid: GridParams) => Promise<void>;
    setSelection: (selection: string[] | undefined) => Promise<void>;
    setEditMenuClickedItems: (
        editMenuClickedItems: string[] | undefined,
    ) => Promise<void>;
    updateItems: (items: Item[]) => void;
}

export const useOwlbearStore = create<OwlbearStore>()(
    subscribeWithSelector((set) => ({
        // dummy values
        role: "PLAYER",
        playerId: "NONE",
        sceneMetadata: DEFAULT_SCENE_METADATA,
        grid: {
            dpi: -1,
            measurement: "CHEBYSHEV",
            type: "SQUARE",
            parsedScale: {
                digits: 1,
                unit: "ft",
                multiplier: 5,
            },
        },
        selection: [],
        editMenuClickedItems: [],
        targetedItems: [],
        setRole: (role: Role) => set({ role }),
        setPlayerId: (playerId: string) => set({ playerId }),
        setSceneMetadata: (metadata: Metadata) =>
            set({ sceneMetadata: extractSceneMetadataOrDefault(metadata) }),
        setGrid: async (grid: GridParams) => {
            const parsedScale = (await OBR.scene.grid.getScale()).parsed;
            return set({
                grid: {
                    dpi: grid.dpi,
                    measurement: grid.measurement,
                    type: grid.type,
                    parsedScale,
                },
            });
        },
        setSelection: async (selection: string[] | undefined) => {
            selection = selection ?? [];

            if (selection.length !== 0) {
                // user actually selected something, so target those items.
                // also the previously edit-clicked items are no longer relevant,
                // so clear them
                const selectedItems = await OBR.scene.items.getItems(selection);
                return set({
                    selection,
                    editMenuClickedItems: [],
                    targetedItems: selectedItems,
                });
            } else {
                return set((state) => {
                    if (state.editMenuClickedItems.length !== 0) {
                        // deselect was probably due to clicking off the context menu,
                        // so leave the targeted items alone
                        return { selection };
                    } else {
                        // no edit menu items, so actually detarget
                        return { selection, targetedItems: [] };
                    }
                });
            }
        },
        setEditMenuClickedItems: async (
            editMenuClickedItems: string[] | undefined,
        ) => {
            editMenuClickedItems = editMenuClickedItems ?? [];
            const targetedItems =
                editMenuClickedItems.length === 0
                    ? []
                    : await OBR.scene.items.getItems(editMenuClickedItems);
            return set({ editMenuClickedItems, targetedItems });
        },
        updateItems: (items: Item[]) =>
            set((state) => {
                const targetList =
                    state.selection.length !== 0
                        ? state.selection
                        : state.editMenuClickedItems;
                const targetedItems = items.filter((item) =>
                    targetList.includes(item.id),
                );
                return { targetedItems };
            }),
    })),
);
