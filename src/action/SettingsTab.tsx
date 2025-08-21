import {
    Divider,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    Switch,
    Typography,
} from "@mui/material";
import { version } from "../../package.json";
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
    const showAdvancedOptions = usePlayerStorage(
        (store) => store.showAdvancedOptions,
    );
    const setShowAdvancedOptions = usePlayerStorage(
        (store) => store.setShowAdvancedOptions,
    );
    return (
        <>
            <Typography variant="h6">Personal Settings</Typography>
            <FormHelperText sx={{ mb: 2 }}>
                These settings only apply to you, and are saved to your browser.
            </FormHelperText>
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
                <FormControlLabel
                    control={
                        <Switch
                            checked={showAdvancedOptions}
                            onChange={(_, enabled) =>
                                setShowAdvancedOptions(enabled)
                            }
                        />
                    }
                    label="Show advanced options"
                />
                <FormHelperText>
                    Enable advanced options in UI: extra layers, blend modes,
                    and aura types.
                </FormHelperText>
            </FormGroup>
            {role === "GM" && (
                <>
                    <Divider sx={{ mb: 2 }}></Divider>
                    <Typography variant="h6">Scene Settings</Typography>
                    <FormHelperText sx={{ mb: 2 }}>
                        These settings apply to the whole scene, and are only
                        visible to the GM.
                    </FormHelperText>
                    <SceneReadyGate>
                        <FormGroup sx={{ mb: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={sceneMetadata.gridMode}
                                        onChange={(_, gridMode) =>
                                            updateSceneMetadata({ gridMode })
                                        }
                                    />
                                }
                                label="Shape auras to grid"
                            />
                            <FormHelperText>
                                Makes aura styles which support highlighting
                                grid cells do so.
                            </FormHelperText>
                        </FormGroup>
                        <OverrideShapeSelector
                            value={sceneMetadata.shapeOverride}
                            onChange={(shapeOverride) =>
                                void updateSceneMetadata({ shapeOverride })
                            }
                        />
                    </SceneReadyGate>
                </>
            )}
            <Typography
                sx={{ mt: 1 }}
                color="textSecondary"
                variant="subtitle2"
            >
                Auras & Emanations version {version}
            </Typography>
        </>
    );
}
