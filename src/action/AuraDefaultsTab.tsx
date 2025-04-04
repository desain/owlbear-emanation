import { Stack } from "@mui/material";
import { ColorInput } from "../ui/components/ColorInput";
import { OpacitySlider } from "../ui/components/OpacitySlider";
import { SizeInput } from "../ui/components/SizeInput";
import { StyleSelector } from "../ui/components/StyleSelector";
import { usePlayerSettings } from "../usePlayerSettings";

export function AuraDefaultsTab() {
    const playerSettingsSensible = usePlayerSettings(
        (store) => store.hasSensibleValues,
    );
    const styleType = usePlayerSettings((store) => store.styleType);
    const size = usePlayerSettings((store) => store.size);
    const color = usePlayerSettings((store) => store.color);
    const opacity = usePlayerSettings((store) => store.opacity);
    const setStyleType = usePlayerSettings((store) => store.setStyleType);
    const setSize = usePlayerSettings((store) => store.setSize);
    const setColor = usePlayerSettings((store) => store.setColor);
    const setOpacity = usePlayerSettings((store) => store.setOpacity);

    if (!playerSettingsSensible) {
        return null;
    }

    return (
        <>
            <h4>Aura Defaults</h4>
            <Stack direction="row" gap={1} sx={{ mb: 2 }}>
                <StyleSelector
                    fullWidth
                    value={styleType}
                    onChange={setStyleType}
                />
                <SizeInput value={size} onChange={setSize} />
            </Stack>
            <Stack direction="row" gap={1}>
                <ColorInput value={color} onChange={setColor} />
                <OpacitySlider
                    sx={{ flexGrow: 1 }}
                    value={opacity}
                    onChange={setOpacity}
                />
            </Stack>
        </>
    );
}
