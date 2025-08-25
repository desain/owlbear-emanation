import { Delete as DeleteIcon } from "@mui/icons-material";
import {
    Autocomplete,
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    TextField,
} from "@mui/material";
import { Control } from "owlbear-utils";
import type { PresetGroup } from "../state/usePlayerStorage";
import { usePlayerStorage } from "../state/usePlayerStorage";

export function PresetGroupEditor({
    presetGroup,
}: {
    presetGroup: PresetGroup;
}) {
    const presets = usePlayerStorage((store) => store.presets);
    const setPresetGroupName = usePlayerStorage(
        (store) => store.setPresetGroupName,
    );
    const setPresetGroupPresets = usePlayerStorage(
        (store) => store.setPresetGroupPresets,
    );
    const deletePresetGroup = usePlayerStorage(
        (store) => store.deletePresetGroup,
    );

    const presetOptions = presets.map((preset) => ({
        id: preset.id,
        label: preset.name,
    }));

    const selectedPresets = presetGroup.presets
        .map((presetId) => {
            const preset = presets.find((p) => p.id === presetId);
            return preset ? { id: preset.id, label: preset.name } : undefined;
        })
        .filter((p): p is { id: string; label: string } => p !== undefined);

    return (
        <Card sx={{ mb: 1 }}>
            <CardHeader
                title={
                    <Control label="Preset Group Name">
                        <TextField
                            value={presetGroup.name}
                            onChange={(e) =>
                                setPresetGroupName(
                                    presetGroup.id,
                                    e.target.value,
                                )
                            }
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
                <Autocomplete
                    multiple
                    options={presetOptions}
                    value={selectedPresets}
                    onChange={(_, newValue) => {
                        setPresetGroupPresets(
                            presetGroup.id,
                            newValue.map((v) => v.id),
                        );
                    }}
                    isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                    }
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="outlined"
                            label="Presets"
                        />
                    )}
                />
            </CardContent>
            <CardActions>
                <Button
                    onClick={() => deletePresetGroup(presetGroup.id)}
                    startIcon={<DeleteIcon />}
                >
                    Delete
                </Button>
            </CardActions>
        </Card>
    );
}
