import { Card, CardActions, CardContent, Typography } from "@mui/material";
import { usePlayerStorage } from "../state/usePlayerStorage";
import { getStyle } from "../utils/messaging";
import { AuraConfigEditor } from "./AuraConfigEditor";
import { CopyButton } from "./CopyButton";
import { PasteButton } from "./PasteButton";

export function AuraDefaultsTab() {
    const playerSettingsSensible = usePlayerStorage(
        (store) => store.hasSensibleValues,
    );
    const config = usePlayerStorage((store) => store);
    const setStyle = usePlayerStorage((store) => store.setStyle);
    const setSize = usePlayerStorage((store) => store.setSize);
    const setVisibility = usePlayerStorage((store) => store.setVisibility);
    const setLayer = usePlayerStorage((store) => store.setLayer);

    if (!playerSettingsSensible) {
        return null;
    }

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
                        setLayer={setLayer}
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
