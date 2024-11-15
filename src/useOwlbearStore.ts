import OBR, { Item, Metadata } from "@owlbear-rodeo/sdk";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { GridParams, GridParsed } from "./types/GridParsed";
import {
    getPlayerMetadataOrDefault as extractPlayerMetadataOrDefault,
    PlayerMetadata,
} from "./types/metadata/PlayerMetadata";
import {
    DEFAULT_SCENE_METADATA,
    extractSceneMetadataOrDefault,
    SceneMetadata,
} from "./types/metadata/SceneMetadata";

type Role = Awaited<ReturnType<typeof OBR.player.getRole>>;

export interface OwlbearStore {
    role: Role;
    playerMetadata: PlayerMetadata;
    sceneMetadata: SceneMetadata;
    grid: GridParsed;
    selection: string[];
    selectedItems: Item[];
    setRole: (role: Role) => void;
    setPlayerMetadata: (metadata: Metadata) => Promise<void>;
    setSceneMetadata: (metadata: Metadata) => void;
    setGrid: (grid: GridParams) => Promise<void>;
    setSelection: (selection: string[] | undefined) => Promise<void>;
    updateItems: (items: Item[]) => void;
}

export const useOwlbearStore = create<OwlbearStore>()(
    subscribeWithSelector((set) => ({
        // dummy values
        role: "PLAYER",
        playerMetadata: {
            color: "#FF00FF",
            opacity: 1,
            size: 5,
            styleType: "Simple",
        },
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
        selectedItems: [],
        setRole: (role: Role) => set({ role }),
        setPlayerMetadata: async (metadata: Metadata) =>
            set({
                playerMetadata: await extractPlayerMetadataOrDefault(metadata),
            }),
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
            const selectedItems = await OBR.scene.items.getItems(selection);
            return set({ selection, selectedItems: selectedItems });
        },
        updateItems: (items: Item[]) =>
            set((state) => {
                const selectedItems = items.filter((item) =>
                    state.selection.includes(item.id),
                );
                return { selectedItems };
            }),
    })),
);
