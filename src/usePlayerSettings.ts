import OBR from "@owlbear-rodeo/sdk";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PLAYER_SETTINGS_STORE_NAME } from "./constants";
import { AuraConfig } from "./types/AuraConfig";
import { setColor } from "./types/AuraStyle";

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
    _markSensible(this: void): void;
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

export const usePlayerSettings = create<PlayerSettingsStore>()(
    persist(
        (set) => ({
            hasSensibleValues: false,
            size: 5,
            style: {
                type: "Bubble",
                color: { x: 1, y: 1, z: 1 },
                opacity: 1,
            },
            _markSensible() {
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
                                state._markSensible();
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
);
