import OBR from "@owlbear-rodeo/sdk";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PLAYER_SETTINGS_STORE_NAME } from "./constants";
import { AuraStyle, createStyle, setColor } from "./types/AuraStyle";
import { AuraEntry } from "./types/metadata/SourceMetadata";

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

export interface PlayerSettingsStore {
    hasSensibleValues: boolean;
    size: AuraEntry["size"];
    style: AuraEntry["style"];
    visibleTo: AuraEntry["visibleTo"];
    _markSensible(this: void): void;
    setSize(this: void, size: number): void;
    setStyle(style: AuraStyle): void;
    setVisibility(visibleTo: AuraEntry["visibleTo"]): void;
}

export const usePlayerSettings = create<PlayerSettingsStore>()(
    persist(
        (set) => ({
            hasSensibleValues: false,
            size: 5,
            style: createStyle("Simple", "#FFFFFF", 0.5),
            visibleTo: undefined,
            _markSensible() {
                set({ hasSensibleValues: true });
            },
            setSize(size: AuraEntry["size"]) {
                set({ size });
            },
            setStyle(style: AuraEntry["style"]) {
                set({ style });
            },
            setVisibility(visibleTo: AuraEntry["visibleTo"]) {
                set({ visibleTo });
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
