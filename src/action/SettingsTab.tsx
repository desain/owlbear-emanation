import { FormGroup, FormControlLabel, Switch, FormHelperText, Divider, Select, MenuItem, Stack } from '@mui/material';
import { isAuraShape } from '../types/AuraShape';
import { updateSceneMetadata } from '../types/metadata/SceneMetadata';
import { ColorInput } from '../ui/components/ColorInput';
import { Control } from '../ui/components/Control';
import { OpacitySlider } from '../ui/components/OpacitySlider';
import { SizeInput } from '../ui/components/SizeInput';
import { StyleSelector } from '../ui/components/StyleSelector';
import { GmGate } from '../ui/GmGate';
import { SceneReadyGate } from '../ui/SceneReadyGate';
import { useOwlbearStore } from '../useOwlbearStore';
import { usePlayerSettings } from '../usePlayerSettings';

export function SceneSettings() {
    const sceneMetadata = useOwlbearStore((store) => store.sceneMetadata);
    return (
        <>
            <h4>Scene Settings (GM Only)</h4>
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
                    <FormHelperText>
                        Makes aura styles which support highlighting grid cells
                        do so.
                    </FormHelperText>
                </FormGroup>
                <Divider sx={{ mt: 1, mb: 1 }} />
                <Control label="Override Shape" fullWidth>
                    <Select
                        size="small"
                        value={sceneMetadata.shapeOverride ?? "none"}
                        onChange={(event) => {
                            const value = event.target.value;
                            void updateSceneMetadata({
                                shapeOverride: isAuraShape(value)
                                    ? value
                                    : undefined,
                            });
                        }}
                    >
                        <MenuItem value="none">
                            <em>No Override</em>
                        </MenuItem>
                        <MenuItem value="circle">Circle</MenuItem>
                        <MenuItem value="square">Square</MenuItem>
                    </Select>
                    <FormHelperText>
                        Sets the shape of all auras, overriding grid defaults.
                    </FormHelperText>
                </Control>
            </SceneReadyGate>
        </>
    );
}

export function SettingsTab() {
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
            <h4>Aura Defaults</h4>
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
