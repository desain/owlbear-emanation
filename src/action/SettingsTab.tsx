import {
    Divider,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    Switch,
    Typography,
} from "@mui/material";
import { updateSceneMetadata } from "../types/metadata/SceneMetadata";
import { useOwlbearStore } from "../useOwlbearStore";
import { OverrideShapeSelector } from "./OverrideShapeSelector";
import { SceneReadyGate } from "./SceneReadyGate";

export function SceneSettingsTab() {
    const sceneMetadata = useOwlbearStore((store) => store.sceneMetadata);
    return (
        <>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Scene Settings (GM Only)
            </Typography>
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
                <OverrideShapeSelector
                    value={sceneMetadata.shapeOverride}
                    onChange={(shapeOverride) =>
                        void updateSceneMetadata({ shapeOverride })
                    }
                />
            </SceneReadyGate>
        </>
    );
}
