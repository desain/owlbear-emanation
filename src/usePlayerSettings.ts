import OBR from "@owlbear-rodeo/sdk";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PLAYER_SETTINGS_STORE_NAME } from "./constants";
import { AuraStyleType } from "./types/AuraStyle";
import { isHexColor } from "./utils/colorUtils";

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

async function fetchDefaults(): Promise<
    Pick<PlayerSettingsStore, "color" | "size">
> {
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
    styleType: AuraStyleType;
    color: string;
    size: number;
    opacity: number;
    _markSensible(this: void): void;
    setStyleType(this: void, styleType: AuraStyleType): void;
    setColor(this: void, color: string): void;
    setSize(this: void, size: number): void;
    setOpacity(this: void, opacity: number): void;
}

export const usePlayerSettings = create<PlayerSettingsStore>()(
    persist(
        (set) => ({
            hasSensibleValues: false,
            styleType: "Simple",
            color: "#FFFFFF",
            size: 5,
            opacity: 0.5,
            _markSensible() {
                set({ hasSensibleValues: true });
            },
            setStyleType(styleType: AuraStyleType) {
                set({ styleType });
            },
            setColor(color: string) {
                if (isHexColor(color)) {
                    set({ color });
                }
            },
            setSize(size: number) {
                set({ size });
            },
            setOpacity(opacity: number) {
                set({ opacity });
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
                                state.setColor(color);
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
