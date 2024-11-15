import { FormControlLabel, FormGroup, Switch } from "@mui/material";
import Stack from "@mui/material/Stack";

import { updateSceneMetadata } from "../types/metadata/SceneMetadata";
import { ColorInput } from "../ui/components/ColorInput";
import { OpacitySlider } from "../ui/components/OpacitySlider";
import { SizeInput } from "../ui/components/SizeInput";
import { StyleSelector } from "../ui/components/StyleSelector";
import { GmGate } from "../ui/GmGate";
import { SceneReadyGate } from "../ui/SceneReadyGate";
import { useOwlbearStore } from "../useOwlbearStore";
import { usePlayerSettings } from "../usePlayerSettings";

export function SceneSettings() {
    const sceneMetadata = useOwlbearStore((store) => store.sceneMetadata);
    return (
        <>
            <h4>Global Settings</h4>
            <SceneReadyGate>
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
            </SceneReadyGate>
        </>
    );
}

// const SYNC_PARAMS = { syncItems: false };
export function Action() {
    // const initialized = useOwlbearStoreSync(SYNC_PARAMS); store will be synced in background
    const playerSettingsSensible = usePlayerSettings(
        (store) => store.hasSensibleValues,
    );
    const styleType = usePlayerSettings((store) => store.styleType);
    const size = usePlayerSettings((store) => store.size);
    const color = usePlayerSettings((store) => store.color);
    const opacity = usePlayerSettings((store) => store.opacity);
    const setStyleType = usePlayerSettings((store) => store.setStyleType);
    const setSize = usePlayerSettings((store) => store.setSize);
    const setColor = usePlayerSettings((store) => store.setColor);
    const setOpacity = usePlayerSettings((store) => store.setOpacity);

    if (!playerSettingsSensible) {
        return null;
    }

    return (
        <>
            <h4>Defaults</h4>
            <Stack direction="row" gap={1} sx={{ mb: 2 }}>
                <StyleSelector
                    fullWidth
                    value={styleType}
                    onChange={setStyleType}
                />
                <SizeInput value={size} onChange={setSize} />
            </Stack>
            <Stack direction="row" gap={1}>
                <ColorInput value={color} onChange={setColor} />
                <OpacitySlider
                    sx={{ flexGrow: 1 }}
                    value={opacity}
                    onChange={setOpacity}
                />
            </Stack>
            <GmGate>
                <SceneSettings />
            </GmGate>
        </>
    );
}
