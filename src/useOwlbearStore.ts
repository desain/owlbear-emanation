import OBR, { Item, Metadata } from "@owlbear-rodeo/sdk";
import { GridParams, GridParsed } from "owlbear-utils";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
    DEFAULT_SCENE_METADATA,
    extractSceneMetadataOrDefault,
    SceneMetadata,
} from "./types/metadata/SceneMetadata";

type Role = Awaited<ReturnType<typeof OBR.player.getRole>>;

export interface OwlbearStore {
    sceneReady: boolean;
    role: Role;
    playerId: string;
    sceneMetadata: SceneMetadata;
    grid: GridParsed;
    lastNonemptySelection: string[];
    lastNonemptySelectionItems: Item[];
    setSceneReady: (sceneReady: boolean) => void;
    setRole: (role: Role) => void;
    setPlayerId: (playerId: string) => void;
    setSceneMetadata: (metadata: Metadata) => void;
    setGrid: (grid: GridParams) => Promise<void>;
    setSelection: (selection: string[] | undefined) => Promise<void>;
    updateItems: (items: Item[]) => void;
}

export const useOwlbearStore = create<OwlbearStore>()(
    subscribeWithSelector((set) => ({
        // dummy values
        sceneReady: false,
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
        lastNonemptySelection: [],
        lastNonemptySelectionItems: [],
        setSceneReady: (sceneReady: boolean) =>
            set(
                sceneReady
                    ? { sceneReady }
                    : {
                          sceneReady,
                          lastNonemptySelection: [],
                      },
            ),
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
            if (selection && selection.length > 0) {
                return set({
                    lastNonemptySelection: selection,
                    lastNonemptySelectionItems: await OBR.scene.items.getItems(
                        selection,
                    ),
                });
            }
        },
        updateItems: (items: Item[]) =>
            set((state) => {
                const lastNonemptySelectionItems = items.filter((item) =>
                    state.lastNonemptySelection.includes(item.id),
                );
                return {
                    lastNonemptySelectionItems,
                };
            }),
    })),
);
