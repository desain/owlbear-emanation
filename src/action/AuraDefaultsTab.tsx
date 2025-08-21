import { Delete as DeleteIcon } from "@mui/icons-material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import {
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Stack,
    TextField
} from "@mui/material";
import { Control } from "owlbear-utils";
import type { Preset } from "../state/usePlayerStorage";
import { usePlayerStorage } from "../state/usePlayerStorage";
import { DEFAULT_AURA_CONFIG } from "../types/AuraConfig";
import { toConfig } from "../utils/messaging";
import { AuraConfigEditor } from "./AuraConfigEditor";
import { CopyButton } from "./CopyButton";
import { PasteButton } from "./PasteButton";

function PresetEditor({
    preset: { name, id, config },
    disableDelete,
}: {
    preset: Preset;
    disableDelete: boolean;
}) {
    const setPresetName = usePlayerStorage((store) => store.setPresetName);
    const setPresetStyle = usePlayerStorage((store) => store.setPresetStyle);
    const setPresetSize = usePlayerStorage((store) => store.setPresetSize);
    const setPresetVisibility = usePlayerStorage(
        (store) => store.setPresetVisibility,
    );
    const setPresetLayer = usePlayerStorage((store) => store.setPresetLayer);
    const setPresetShapeOverride = usePlayerStorage(
        (store) => store.setPresetShapeOverride,
    );
    const deletePreset = usePlayerStorage((store) => store.deletePreset);

    return (
        <Card sx={{ mb: 1 }}>
            <CardHeader
                title={
                    <Control label="Preset Name">
                        <TextField
                            value={name}
                            onChange={(e) => setPresetName(id, e.target.value)}
                            variant="outlined"
                            size="small"
                            fullWidth
                            slotProps={{
                                input: {
                                    sx: {
                                        fontSize: "1.125rem",
                                        fontWeight: "bold",
                                        lineHeight: "32px",
                                        color: "text.primary",
                                    },
                                },
                            }}
                        />
                    </Control>
                }
            />
            <CardContent>
                <AuraConfigEditor
                    config={config}
                    setStyle={(style) => setPresetStyle(id, style)}
                    setSize={(size) => setPresetSize(id, size)}
                    setVisibility={(visibility) =>
                        setPresetVisibility(id, visibility)
                    }
                    setLayer={(layer) => setPresetLayer(id, layer)}
                    setShapeOverride={(shapeOverride) =>
                        setPresetShapeOverride(id, shapeOverride)
                    }
                />
            </CardContent>
            <CardActions>
                <Button
                    onClick={() => deletePreset(id)}
                    startIcon={<DeleteIcon />}
                    disabled={disableDelete}
                >
                    Delete
                </Button>
                <CopyButton config={config} />
            </CardActions>
        </Card>
    );
}

export function AuraDefaultsTab() {
    const playerSettingsSensible = usePlayerStorage(
        (store) => store.hasSensibleValues,
    );
    const presets = usePlayerStorage((store) => store.presets);
    const createPreset = usePlayerStorage((store) => store.createPreset);

    if (!playerSettingsSensible) {
        return null;
    }

    return (
        <>
            {presets.map((preset) => (
                <PresetEditor
                    key={preset.id}
                    preset={preset}
                    disableDelete={presets.length === 1}
                />
            ))}
            <Stack
                direction="row"
                spacing={1}
                justifyContent="center"
                flexWrap={"wrap"}
                rowGap={1}
            >
                <Button
                    startIcon={<AddCircleIcon />}
                    variant="outlined"
                    onClick={() =>
                        createPreset("New Preset", DEFAULT_AURA_CONFIG)
                    }
                >
                    New
                </Button>
                <PasteButton
                    onPaste={(message) => {
                        createPreset("New Preset", toConfig(message));
                    }}
                />
            </Stack>
        </>
    );
}
