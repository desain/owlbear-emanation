import { FormControlLabel, FormGroup, Switch } from "@mui/material";
import Stack from "@mui/material/Stack";
import { updatePlayerMetadata } from "../types/metadata/PlayerMetadata";

import { updateSceneMetadata } from "../types/metadata/SceneMetadata";
import { ColorInput } from "../ui/components/ColorInput";
import { OpacitySlider } from "../ui/components/OpacitySlider";
import { SizeInput } from "../ui/components/SizeInput";
import { StyleSelector } from "../ui/components/StyleSelector";
import { GmGate } from "../ui/GmGate";
import { useOwlbearStore } from "../useOwlbearStore";

export function SceneSettings() {
    const sceneMetadata = useOwlbearStore((store) => store.sceneMetadata);
    return (
        <>
            <h4>Global Settings</h4>
            <FormGroup>
                <FormControlLabel
                    control={
                        <Switch
                            checked={sceneMetadata.gridMode}
                            onChange={(_, gridMode) =>
                                updateSceneMetadata({ gridMode })
                            }
                        />
                    }
                    label="Shape to grid"
                />
                {/* <FormHelperText>
                    When enabled, configures aura styles which support
                    highlighting grid cells to do so.
                </FormHelperText> */}
            </FormGroup>
        </>
    );
}

// const SYNC_PARAMS = { syncItems: false };
export function Action() {
    // const initialized = useOwlbearStoreSync(SYNC_PARAMS); store will be synced in background
    const playerMetadata = useOwlbearStore((store) => store.playerMetadata);

    // if (!initialized) {
    //     return null;
    // }

    return (
        <>
            <h4>Defaults</h4>
            <Stack direction="row" gap={1} sx={{ mb: 2 }}>
                <StyleSelector
                    fullWidth
                    value={playerMetadata.styleType}
                    onChange={(styleType) =>
                        updatePlayerMetadata({ styleType })
                    }
                />
                <SizeInput
                    value={playerMetadata.size}
                    onChange={(size) => updatePlayerMetadata({ size })}
                />
            </Stack>
            <Stack direction="row" gap={1}>
                <ColorInput
                    value={playerMetadata.color}
                    onChange={(color) => updatePlayerMetadata({ color })}
                />
                <OpacitySlider
                    sx={{ flexGrow: 1 }}
                    value={playerMetadata.opacity}
                    onChange={(opacity) => updatePlayerMetadata({ opacity })}
                />
            </Stack>
            <GmGate>
                <SceneSettings />
            </GmGate>
        </>
    );
}
