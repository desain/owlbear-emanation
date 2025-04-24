import {
    Divider,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    Switch,
    Typography,
} from "@mui/material";
import { usePlayerStorage } from "../state/usePlayerStorage";
import { updateSceneMetadata } from "../types/metadata/SceneMetadata";
import { OverrideShapeSelector } from "./OverrideShapeSelector";
import { SceneReadyGate } from "./SceneReadyGate";

export function SettingsTab() {
    const sceneMetadata = usePlayerStorage((store) => store.sceneMetadata);
    const enableContextMenu = usePlayerStorage(
        (store) => store.enableContextMenu,
    );
    const setContextMenuEnabled = usePlayerStorage(
        (store) => store.setContextMenuEnabled,
    );
    const role = usePlayerStorage((store) => store.role);
    return (
        <>
            <Typography variant="h6" sx={{ mb: 2 }}>
                My Settings
            </Typography>
            <FormGroup sx={{ mb: 2 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={enableContextMenu}
                            onChange={(_, enabled) =>
                                setContextMenuEnabled(enabled)
                            }
                        />
                    }
                    label="Enable context menu"
                />
                <FormHelperText>
                    Enable context menu items to add or edit auras on tokens.
                </FormHelperText>
            </FormGroup>
            {role === "GM" && (
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
                                Makes aura styles which support highlighting
                                grid cells do so.
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
            )}
        </>
    );
}
