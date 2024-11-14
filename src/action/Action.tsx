import {
    FormControlLabel,
    FormGroup,
    FormHelperText,
    Switch,
} from "@mui/material";
import Stack from "@mui/material/Stack";
import { updatePlayerMetadata } from "../types/metadata/PlayerMetadata";

import { updateSceneMetadata } from "../types/metadata/SceneMetadata";
import { ColorInput } from "../ui/components/ColorInput";
import { OpacitySlider } from "../ui/components/OpacitySlider";
import { SizeInput } from "../ui/components/SizeInput";
import { StyleSelector } from "../ui/components/StyleSelector";
import { useGrid, usePlayerMetadata, useSceneMetadata } from "../ui/hooks";

export function SceneSettings() {
    const sceneMetadata = useSceneMetadata();

    if (sceneMetadata === null) {
        return null;
    }

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

export function Action() {
    const playerMetadata = usePlayerMetadata();
    const grid = useGrid();

    if (grid === null || playerMetadata === null) {
        return null;
    }

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
                    grid={grid}
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
            <SceneSettings />
        </>
    );
}
