import OBR, { Item, Metadata } from "@owlbear-rodeo/sdk";
import { enableMapSet } from "immer";
import { GridParams, GridParsed } from "owlbear-utils";
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
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

export interface Preset {
    name: string;
    id: string;
    config: AuraConfig;
}

export interface PlayerSettingsStore {
    hasSensibleValues: boolean;
    [SET_SENSIBLE](this: void): void;
    presets: Preset[];
    setPresetSize(this: void, id: string, size: AuraConfig["size"]): void;
    setPresetStyle(this: void, id: string, style: AuraConfig["style"]): void;
    setPresetVisibility(
        this: void,
        id: string,
        visibleTo: AuraConfig["visibleTo"],
    ): void;
    setPresetLayer(
        this: void,
        id: string,
        layer: NonNullable<AuraConfig["layer"]>,
    ): void;
}

/**
 * Get preset by ID
 * @throws if no preset with that ID exists
 */
function getPreset(state: PlayerSettingsStore, id: string): Preset {
    const preset = state.presets.find((preset) => preset.id === id);
    if (!preset) {
        throw new Error(`Invalid preset ID ${id}`);
    }
    return preset;
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
            immer((set) => ({
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
                presets: [
                    {
                        name: "Default",
                        id: crypto.randomUUID(),
                        config: {
                            size: 5,
                            style: {
                                type: "Bubble",
                                color: { x: 1, y: 1, z: 1 },
                                opacity: 1,
                            },
                        },
                    },
                ],
                [SET_SENSIBLE]() {
                    set({ hasSensibleValues: true });
                },
                setPresetSize: (id: string, size: AuraConfig["size"]) =>
                    set((state) => {
                        const preset = getPreset(state, id);
                        preset.config.size = size;
                    }),
                setPresetStyle: (id: string, style: AuraConfig["style"]) =>
                    set((state) => {
                        const preset = getPreset(state, id);
                        preset.config.style = style;
                    }),
                setPresetVisibility: (
                    id: string,
                    visibleTo: AuraConfig["visibleTo"],
                ) =>
                    set((state) => {
                        const preset = getPreset(state, id);
                        preset.config.visibleTo = visibleTo;
                    }),
                setPresetLayer: (
                    id: string,
                    layer: NonNullable<AuraConfig["layer"]>,
                ) =>
                    set((state) => {
                        const preset = getPreset(state, id);
                        preset.config.layer = layer;
                    }),
            })),
            {
                name: PLAYER_SETTINGS_STORE_NAME,
                partialize({ hasSensibleValues, presets }) {
                    return { hasSensibleValues, presets };
                },
                onRehydrateStorage() {
                    // console.log("onRehydrateStorage");
                    return (state, error) => {
                        // console.log("onRehydrateStorage callback", state, error);
                        if (state) {
                            if (!state.hasSensibleValues) {
                                // console.log("Not sensible, fetching defaults");
                                void fetchDefaults().then(({ color, size }) => {
                                    if (state.presets.length > 0) {
                                        const defaultPreset = state.presets[0];
                                        const newStyle = {
                                            ...defaultPreset.config.style,
                                        };
                                        setColor(newStyle, color);
                                        state.setPresetStyle(
                                            defaultPreset.id,
                                            newStyle,
                                        );
                                        state.setPresetSize(
                                            defaultPreset.id,
                                            size,
                                        );
                                        // console.log("Fetched defaults", color, size);
                                        state[SET_SENSIBLE]();
                                    }
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
                version: 1,
                migrate(persistedState, version: number) {
                    // Move defaults into preset
                    if (version === 0) {
                        const oldConfig = persistedState as AuraConfig; // lazy hack to avoid creating a bunch of type check helpers
                        const defaultPreset: Preset = {
                            name: "Default",
                            id: crypto.randomUUID(),
                            config: {
                                size: oldConfig.size,
                                style: oldConfig.style,
                                layer: oldConfig.layer,
                                visibleTo: oldConfig.visibleTo,
                            },
                        };
                        delete (persistedState as Partial<AuraConfig>).size;
                        delete (persistedState as Partial<AuraConfig>).style;
                        delete (persistedState as Partial<AuraConfig>).layer;
                        delete (persistedState as Partial<AuraConfig>)
                            .visibleTo;
                        (persistedState as PlayerStorage).presets = [
                            defaultPreset,
                        ];
                    }

                    return persistedState;
                },
            },
        ),
    ),
);
