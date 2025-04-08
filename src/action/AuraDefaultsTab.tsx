import { Card, CardActions, CardContent, Typography } from "@mui/material";
import { AuraConfig } from "../types/AuraConfig";
import { usePlayerSettings } from "../usePlayerSettings";
import { getStyle } from "../utils/messaging";
import { AuraConfigEditor } from "./AuraConfigEditor";
import { CopyButton } from "./CopyButton";
import { PasteButton } from "./PasteButton";

export function AuraDefaultsTab() {
    const playerSettingsSensible = usePlayerSettings(
        (store) => store.hasSensibleValues,
    );
    const style = usePlayerSettings((store) => store.style);
    const size = usePlayerSettings((store) => store.size);
    const visibleTo = usePlayerSettings((store) => store.visibleTo);
    const setStyle = usePlayerSettings((store) => store.setStyle);
    const setSize = usePlayerSettings((store) => store.setSize);
    const setVisibility = usePlayerSettings((store) => store.setVisibility);

    if (!playerSettingsSensible) {
        return null;
    }

    const config: AuraConfig = { style, size, visibleTo };

    return (
        <>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Default Settings for New Auras
            </Typography>
            <Card>
                <CardContent>
                    <AuraConfigEditor
                        config={config}
                        setStyle={setStyle}
                        setSize={setSize}
                        setVisibility={setVisibility}
                    />
                </CardContent>
                <CardActions>
                    <CopyButton config={config} />
                    <PasteButton
                        onPaste={(message) => {
                            setSize(message.size);
                            setVisibility(message.visibleTo);
                            setStyle(getStyle(message));
                        }}
                    />
                </CardActions>
            </Card>
        </>
    );
}
