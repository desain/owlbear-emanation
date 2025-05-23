import type { Item, Metadata, Permission, Player } from "@owlbear-rodeo/sdk";
import OBR from "@owlbear-rodeo/sdk";
import type { WritableDraft } from "immer";
import { enableMapSet } from "immer";
import type {
    ExtractNonFunctions,
    GridParams,
    GridParsed,
    HexColor,
    Role,
} from "owlbear-utils";
import { assumeHexColor, units, type Units } from "owlbear-utils";
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
    ID_TOOL_MODE_SHIFT_AURA,
    PLAYER_SETTINGS_STORE_NAME,
} from "../constants";
import type { AuraConfig } from "../types/AuraConfig";
import { DEFAULT_AURA_CONFIG } from "../types/AuraConfig";
import { setColor } from "../types/AuraStyle";
import type { SceneMetadata } from "../types/metadata/SceneMetadata";
import {
    DEFAULT_SCENE_METADATA,
    extractSceneMetadataOrDefault,
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

async function fetchDefaults(): Promise<{ color: HexColor; size: Units }> {
    await ObrSceneReady;
    const [color, scale] = await Promise.all([
        OBR.player.getColor(),
        OBR.scene.grid.getScale(),
    ]);
    return {
        color: assumeHexColor(color),
        size: units(scale.parsed.multiplier),
    };
}

export interface Preset {
    name: string;
    id: string;
    config: AuraConfig;
}

interface LocalStorage {
    readonly hasSensibleValues: boolean;
    readonly [SET_SENSIBLE]: (this: void) => void;
    readonly presets: Preset[];
    readonly enableContextMenu: boolean;
    readonly showAdvancedOptions: boolean;
    readonly setPresetName: (this: void, id: string, name: string) => void;
    readonly setPresetSize: (
        this: void,
        id: string,
        size: AuraConfig["size"],
    ) => void;
    readonly setPresetStyle: (
        this: void,
        id: string,
        style: AuraConfig["style"],
    ) => void;
    readonly setPresetVisibility: (
        this: void,
        id: string,
        visibleTo: AuraConfig["visibleTo"],
    ) => void;
    readonly setPresetLayer: (
        this: void,
        id: string,
        layer: NonNullable<AuraConfig["layer"]>,
    ) => void;
    readonly setPresetShapeOverride: (
        this: void,
        id: string,
        shapeOverride: AuraConfig["shapeOverride"],
    ) => void;
    readonly createPreset: (
        this: void,
        name: string,
        config: AuraConfig,
    ) => void;
    readonly deletePreset: (this: void, id: string) => void;
    readonly setContextMenuEnabled: (
        this: void,
        enableContextMenu: boolean,
    ) => void;
    readonly setShowAdvancedOptions: (this: void, show: boolean) => void;
}
function partializeLocalStorage({
    hasSensibleValues,
    presets,
    enableContextMenu,
    showAdvancedOptions,
}: LocalStorage): ExtractNonFunctions<LocalStorage> {
    return {
        hasSensibleValues,
        presets,
        enableContextMenu,
        showAdvancedOptions,
    };
}

/**
 * Get preset by ID
 * @throws if no preset with that ID exists
 */
function getPreset(state: LocalStorage, id: string): Preset {
    const preset = state.presets.find((preset) => preset.id === id);
    if (!preset) {
        throw new Error(`Invalid preset ID ${id}`);
    }
    return preset;
}

interface OwlbearStore {
    readonly sceneReady: boolean;
    readonly role: Role;
    readonly playerId: string;
    readonly sceneMetadata: SceneMetadata;
    readonly grid: GridParsed;
    readonly lastNonemptySelection: string[];
    /**
     * Subset of the selection that's updatable.
     */
    readonly lastNonemptySelectionUpdatableItems: Item[];
    readonly usingShiftMode: boolean;
    readonly playerPermissions: Set<Permission>;
    readonly setSceneReady: (this: void, sceneReady: boolean) => void;
    readonly handlePlayerChange: (
        this: void,
        player: Pick<Player, "id" | "role" | "selection">,
    ) => void;
    readonly setSceneMetadata: (this: void, metadata: Metadata) => void;
    readonly setGrid: (this: void, grid: GridParams) => Promise<void>;
    readonly setSelection: (
        this: void,
        selection: string[] | undefined,
    ) => Promise<void>;
    readonly updateItems: (this: void, items: Item[]) => void;
    readonly handleToolModeUpdate: (
        this: void,
        activeToolMode: string | undefined,
    ) => void;
    readonly handlePermissionsChange: (
        this: void,
        permissions: readonly Permission[],
    ) => void;
    readonly isUpdatable: (this: void, item: Item) => boolean;
}

export interface PlayerStorage extends LocalStorage, OwlbearStore {}

export const usePlayerStorage = create<PlayerStorage>()(
    subscribeWithSelector(
        persist(
            immer((set, get) => ({
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
                lastNonemptySelectionUpdatableItems: [],
                usingShiftMode: false,
                playerPermissions: new Set(),
                setSceneReady: (sceneReady: boolean) =>
                    set(
                        sceneReady
                            ? { sceneReady }
                            : {
                                  sceneReady,
                                  lastNonemptySelection: [],
                                  lastNonemptySelectionUpdatableItems: [],
                              },
                    ),
                handlePlayerChange: async (player) => {
                    set({
                        playerId: player.id,
                        role: player.role,
                    });
                    await get().setSelection(player.selection);
                },
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
                        const isUpdatable = get().isUpdatable;
                        const items = await OBR.scene.items.getItems(selection);
                        return set({
                            lastNonemptySelection: selection,
                            lastNonemptySelectionUpdatableItems:
                                items.filter(isUpdatable),
                        });
                    }
                },
                updateItems: (items: Item[]) =>
                    set((state) => {
                        const lastNonemptySelectionUpdatableItems =
                            items.filter(
                                (item) =>
                                    state.lastNonemptySelection.includes(
                                        item.id,
                                    ) && state.isUpdatable(item),
                            );
                        return {
                            lastNonemptySelectionUpdatableItems,
                        };
                    }),
                handleToolModeUpdate: (activeToolMode) =>
                    set({
                        usingShiftMode:
                            activeToolMode === ID_TOOL_MODE_SHIFT_AURA,
                    }),
                handlePermissionsChange: (permissions) =>
                    set({ playerPermissions: new Set(permissions) }),
                isUpdatable: (item) => {
                    const state = get();
                    if (state.role === "GM") {
                        return true;
                    } else {
                        switch (item.layer) {
                            case "ATTACHMENT":
                                return state.playerPermissions.has(
                                    "ATTACHMENT_UPDATE",
                                );
                            case "CHARACTER":
                                return state.playerPermissions.has(
                                    "CHARACTER_UPDATE",
                                );
                            case "DRAWING":
                                return state.playerPermissions.has(
                                    "DRAWING_UPDATE",
                                );
                            case "FOG":
                                return state.playerPermissions.has(
                                    "FOG_UPDATE",
                                );
                            case "MAP":
                                return state.playerPermissions.has(
                                    "MAP_UPDATE",
                                );
                            case "MOUNT":
                                return state.playerPermissions.has(
                                    "MOUNT_UPDATE",
                                );
                            case "NOTE":
                                return state.playerPermissions.has(
                                    "NOTE_UPDATE",
                                );
                            case "POINTER":
                                return state.playerPermissions.has(
                                    "POINTER_UPDATE",
                                );
                            case "PROP":
                                return state.playerPermissions.has(
                                    "PROP_UPDATE",
                                );
                            case "RULER":
                                return state.playerPermissions.has(
                                    "RULER_UPDATE",
                                );
                            case "TEXT":
                                return state.playerPermissions.has(
                                    "TEXT_UPDATE",
                                );
                            case "CONTROL":
                            case "GRID":
                            case "POPOVER":
                            case "POST_PROCESS":
                            default:
                                return false;
                        }
                    }
                },

                // Local storage
                hasSensibleValues: false,
                presets: [
                    {
                        name: "Default",
                        id: crypto.randomUUID(),
                        config: DEFAULT_AURA_CONFIG,
                    },
                ],
                enableContextMenu: true,
                showAdvancedOptions: false,
                [SET_SENSIBLE]: () => {
                    set({ hasSensibleValues: true });
                },
                setPresetName: (id: string, name: string) =>
                    set((state) => {
                        const preset = getPreset(state, id);
                        preset.name = name;
                    }),
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
                setPresetShapeOverride: (
                    id: string,
                    shapeOverride: AuraConfig["shapeOverride"],
                ) =>
                    set((state) => {
                        const preset = getPreset(state, id);
                        preset.config.shapeOverride = shapeOverride;
                    }),
                createPreset: (name: string, config: AuraConfig) =>
                    set((state) => {
                        state.presets.push({
                            name,
                            id: crypto.randomUUID(),
                            config,
                        });
                    }),
                deletePreset: (id: string) =>
                    set((state) => {
                        state.presets = state.presets.filter(
                            (preset) => preset.id !== id,
                        );
                    }),
                setContextMenuEnabled: (enableContextMenu) =>
                    set({ enableContextMenu }),
                setShowAdvancedOptions: (showAdvancedOptions) =>
                    set({ showAdvancedOptions }),
            })),
            {
                name: PLAYER_SETTINGS_STORE_NAME,
                partialize: partializeLocalStorage,
                onRehydrateStorage: () => (state, error) => {
                    // console.log(
                    //     "onRehydrateStorage callback",
                    //     state,
                    //     error,
                    // );
                    if (state) {
                        // work around missing keys in migrated preset
                        if (state.presets[0] && !state.presets[0].config.size) {
                            state.setPresetSize(
                                state.presets[0].id,
                                DEFAULT_AURA_CONFIG.size,
                            );
                        }
                        if (
                            state.presets[0] &&
                            !state.presets[0].config.style
                        ) {
                            state.setPresetStyle(
                                state.presets[0].id,
                                DEFAULT_AURA_CONFIG.style,
                            );
                        }
                        if (!state.hasSensibleValues) {
                            // console.log("Not sensible, fetching defaults");
                            void fetchDefaults().then(({ color, size }) => {
                                const defaultPreset = state.presets[0];
                                if (defaultPreset) {
                                    const newStyle = {
                                        ...defaultPreset.config.style,
                                    };
                                    setColor(newStyle, color);
                                    state.setPresetStyle(
                                        defaultPreset.id,
                                        newStyle,
                                    );
                                    state.setPresetSize(defaultPreset.id, size);
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
                },
                version: 1,
                migrate: (persistedState, version: number) => {
                    // Move defaults into preset
                    if (version === 0) {
                        const oldConfig = persistedState as Partial<AuraConfig>; // lazy hack to avoid creating a bunch of type check helpers
                        const defaultPreset: Preset = {
                            name: "Default",
                            id: crypto.randomUUID(),
                            config: {
                                size:
                                    oldConfig.size ?? DEFAULT_AURA_CONFIG.size,
                                style:
                                    oldConfig.style ??
                                    DEFAULT_AURA_CONFIG.style,
                                layer: oldConfig.layer,
                                visibleTo: oldConfig.visibleTo,
                            },
                        };
                        (
                            persistedState as WritableDraft<PlayerStorage>
                        ).presets = [defaultPreset];
                        delete oldConfig.size;
                        delete oldConfig.style;
                        delete oldConfig.layer;
                        delete oldConfig.visibleTo;
                    }
                    return persistedState;
                },
            },
        ),
    ),
);
