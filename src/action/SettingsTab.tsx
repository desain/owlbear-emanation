import {
    Divider,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    Switch,
} from "@mui/material";
import { updateSceneMetadata } from "../types/metadata/SceneMetadata";
import { OverrideShapeSelector } from "../ui/components/OverrideShapeSelector";
import { SceneReadyGate } from "../ui/SceneReadyGate";
import { useOwlbearStore } from "../useOwlbearStore";

export function SceneSettingsTab() {
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
