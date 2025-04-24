import {
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Typography,
} from "@mui/material";
import { Preset, usePlayerStorage } from "../state/usePlayerStorage";
import { getStyle } from "../utils/messaging";
import { AuraConfigEditor } from "./AuraConfigEditor";
import { CopyButton } from "./CopyButton";
import { PasteButton } from "./PasteButton";

function PresetEditor({ preset: { name, id, config } }: { preset: Preset }) {
    const setPresetStyle = usePlayerStorage((store) => store.setPresetStyle);
    const setPresetSize = usePlayerStorage((store) => store.setPresetSize);
    const setPresetVisibility = usePlayerStorage(
        (store) => store.setPresetVisibility,
    );
    const setPresetLayer = usePlayerStorage((store) => store.setPresetLayer);

    return (
        <Card>
            <CardHeader
                title={name}
                slotProps={{
                    title: {
                        sx: {
                            fontSize: "1.125rem",
                            fontWeight: "bold",
                            lineHeight: "32px",
                            color: "text.primary",
                        },
                    },
                }}
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
                />
            </CardContent>
            <CardActions>
                <CopyButton config={config} />
                <PasteButton
                    onPaste={(message) => {
                        setPresetSize(id, message.size);
                        setPresetVisibility(id, message.visibleTo);
                        setPresetStyle(id, getStyle(message));
                        if (message.layer) {
                            setPresetLayer(id, message.layer);
                        }
                    }}
                />
            </CardActions>
        </Card>
    );
}

export function AuraDefaultsTab() {
    const playerSettingsSensible = usePlayerStorage(
        (store) => store.hasSensibleValues,
    );
    const presets = usePlayerStorage((store) => store.presets);

    if (!playerSettingsSensible) {
        return null;
    }

    return (
        <>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Default Settings for New Auras
            </Typography>
            {presets.map((preset) => (
                <PresetEditor key={preset.id} preset={preset} />
            ))}
        </>
    );
}
