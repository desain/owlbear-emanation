import { Stack } from "@mui/material";
import { produce } from "immer";
import {
    AuraStyle,
    getColor,
    getOpacity,
    isColorOpacityShaderStyle,
    isSimpleStyle,
    setColor,
    setOpacity,
    setStyleType,
} from "../types/AuraStyle";
import { ColorInput } from "../ui/components/ColorInput";
import { OpacitySlider } from "../ui/components/OpacitySlider";
import { SizeInput } from "../ui/components/SizeInput";
import { StyleSelector } from "../ui/components/StyleSelector";
import { usePlayerSettings } from "../usePlayerSettings";

function StyleAndSizeEditor({
    style,
    setStyle,
    size,
    setSize,
}: {
    style: AuraStyle;
    size: number;
    setStyle: (style: AuraStyle) => void;
    setSize: (size: number) => void;
}) {
    const hasColorOpacityControls =
        isSimpleStyle(style) || isColorOpacityShaderStyle(style);

    return (
        <>
            <Stack direction="row" gap={1} sx={{ mb: 2 }}>
                <StyleSelector
                    fullWidth
                    value={style.type}
                    onChange={(styleType) =>
                        setStyle(setStyleType(style, styleType))
                    }
                />
                <SizeInput value={size} onChange={setSize} />
            </Stack>
            {hasColorOpacityControls && (
                <Stack direction="row" gap={1}>
                    <ColorInput
                        value={getColor(style)}
                        onChange={(color) =>
                            setStyle(
                                produce(style, (style) => {
                                    setColor(style, color);
                                }),
                            )
                        }
                    />
                    <OpacitySlider
                        sx={{ flexGrow: 1 }}
                        value={getOpacity(style)}
                        onChange={(opacity) =>
                            setStyle(
                                produce(style, (style) => {
                                    setOpacity(style, opacity);
                                }),
                            )
                        }
                    />
                </Stack>
            )}
        </>
    );
}

export function AuraDefaultsTab() {
    const playerSettingsSensible = usePlayerSettings(
        (store) => store.hasSensibleValues,
    );
    const style = usePlayerSettings((store) => store.style);
    const size = usePlayerSettings((store) => store.size);
    const setStyle = usePlayerSettings((store) => store.setStyle);
    const setSize = usePlayerSettings((store) => store.setSize);

    if (!playerSettingsSensible) {
        return null;
    }

    return (
        <>
            <h4>Aura Defaults</h4>
            <StyleAndSizeEditor
                style={style}
                setStyle={setStyle}
                size={size}
                setSize={setSize}
            />
        </>
    );
}
