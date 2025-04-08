import { Card, CardActions, CardContent } from "@mui/material";
import { AuraConfig } from "../types/AuraConfig";
import { AuraConfigEditor } from "../ui/components/AuraConfigEditor";
import { CopyButton } from "../ui/components/CopyButton";
import { PasteButton } from "../ui/components/PasteButton";
import { usePlayerSettings } from "../usePlayerSettings";
import { getStyle } from "../utils/messaging";

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
            <h4>Default Settings for New Auras</h4>
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
