import OBR, { Item, Metadata } from "@owlbear-rodeo/sdk";
import { enableMapSet } from "immer";
import { GridParams, GridParsed } from "owlbear-utils";
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { PLAYER_SETTINGS_STORE_NAME } from "../constants";
import { AuraConfig } from "../types/AuraConfig";
import { setColor } from "../types/AuraStyle";
import {
    DEFAULT_SCENE_METADATA,
    extractSceneMetadataOrDefault,
    SceneMetadata,
} from "../types/metadata/SceneMetadata";

const SET_SENSIBLE = Symbol("SetSensible");

enableMapSet();

const ObrSceneReady = new Promise<void>((resolve) => {
    OBR.onReady(async () => {
        if (await OBR.scene.isReady()) {
            resolve();
        } else {
            const unsubscribeScene = OBR.scene.onReadyChange((ready) => {
                if (ready) {
                    unsubscribeScene();
                    resolve();
                }
            });
        }
    });
});

async function fetchDefaults(): Promise<{ color: string; size: number }> {
    await ObrSceneReady;
    const [color, scale] = await Promise.all([
        OBR.player.getColor(),
        OBR.scene.grid.getScale(),
    ]);
    return {
        color,
        size: scale.parsed.multiplier,
    };
}

export interface PlayerSettingsStore extends AuraConfig {
    hasSensibleValues: boolean;
    [SET_SENSIBLE](this: void): void;
    setSize(this: void, size: PlayerSettingsStore["size"]): void;
    setStyle(this: void, style: PlayerSettingsStore["style"]): void;
    setVisibility(
        this: void,
        visibleTo: PlayerSettingsStore["visibleTo"],
    ): void;
    setLayer(
        this: void,
        layer: NonNullable<PlayerSettingsStore["layer"]>,
    ): void;
}

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

export interface PlayerStorage extends PlayerSettingsStore, OwlbearStore {}

export const usePlayerStorage = create<PlayerStorage>()(
    subscribeWithSelector(
        persist(
            (set) => ({
                // OBR sync - dummy values
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
                    set({
                        sceneMetadata: extractSceneMetadataOrDefault(metadata),
                    }),
                setGrid: async (grid: GridParams) => {
                    const parsedScale = (await OBR.scene.grid.getScale())
                        .parsed;
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
                            lastNonemptySelectionItems:
                                await OBR.scene.items.getItems(selection),
                        });
                    }
                },
                updateItems: (items: Item[]) =>
                    set((state) => {
                        const lastNonemptySelectionItems = items.filter(
                            (item) =>
                                state.lastNonemptySelection.includes(item.id),
                        );
                        return {
                            lastNonemptySelectionItems,
                        };
                    }),

                // Local storage
                hasSensibleValues: false,
                size: 5,
                style: {
                    type: "Bubble",
                    color: { x: 1, y: 1, z: 1 },
                    opacity: 1,
                },
                [SET_SENSIBLE]() {
                    set({ hasSensibleValues: true });
                },
                setSize(size: PlayerSettingsStore["size"]) {
                    set({ size });
                },
                setStyle(style: PlayerSettingsStore["style"]) {
                    set({ style });
                },
                setVisibility(visibleTo: PlayerSettingsStore["visibleTo"]) {
                    set({ visibleTo });
                },
                setLayer(layer: NonNullable<PlayerSettingsStore["layer"]>) {
                    set({ layer });
                },
            }),
            {
                name: PLAYER_SETTINGS_STORE_NAME,
                partialize({
                    hasSensibleValues,
                    size,
                    style,
                    visibleTo,
                    layer,
                }) {
                    return { hasSensibleValues, size, style, visibleTo, layer };
                },
                onRehydrateStorage() {
                    // console.log("onRehydrateStorage");
                    return (state, error) => {
                        // console.log("onRehydrateStorage callback", state, error);
                        if (state) {
                            if (!state.hasSensibleValues) {
                                // console.log("Not sensible, fetching defaults");
                                void fetchDefaults().then(({ color, size }) => {
                                    const newStyle = { ...state.style };
                                    setColor(newStyle, color);
                                    state.setStyle(newStyle);
                                    state.setSize(size);
                                    // console.log("Fetched defaults", color, size);
                                    state[SET_SENSIBLE]();
                                });
                            }
                        } else if (error) {
                            console.error(
                                "Error hydrating player settings store",
                                error,
                            );
                        }
                    };
                },
            },
        ),
    ),
);
