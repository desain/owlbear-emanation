import { Card, CardActions, CardContent } from "@mui/material";
import { AuraEntryEditor } from "../ui/components/AuraEntryEditor";
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

    return (
        <>
            <h4>Aura Defaults</h4>
            <Card>
                <CardContent>
                    <AuraEntryEditor
                        style={style}
                        setStyle={setStyle}
                        size={size}
                        setSize={setSize}
                        visibleTo={visibleTo}
                        setVisibility={setVisibility}
                    />
                </CardContent>
                <CardActions>
                    <CopyButton
                        size={size}
                        style={style}
                        visibleTo={visibleTo}
                    />
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
