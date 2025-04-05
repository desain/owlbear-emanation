import { Stack } from "@mui/material";
import { produce } from "immer";
import {
    getBlendMode,
    getColor,
    getOpacity,
    isColorOpacityShaderStyle,
    isEffectStyle,
    isSimpleStyle,
    setColor,
    setOpacity,
    setStyleType,
} from "../../types/AuraStyle";
import { AuraEntry } from "../../types/metadata/SourceMetadata";
import { BlendModeSelector } from "./BlendModeSelector";
import { ColorInput } from "./ColorInput";
import { OpacitySlider } from "./OpacitySlider";
import { SizeInput } from "./SizeInput";
import { StyleSelector } from "./StyleSelector";
import { VisibilitySelector } from "./VisibilitySelector";

export function AuraEntryEditor({
    style,
    size,
    visibleTo,
    setStyle,
    setSize,
    setVisibility,
}: {
    style: AuraEntry["style"];
    size: AuraEntry["size"];
    visibleTo: AuraEntry["visibleTo"];
    setStyle: (style: AuraEntry["style"]) => void;
    setSize: (size: AuraEntry["size"]) => void;
    setVisibility: (visibleTo: AuraEntry["visibleTo"]) => void;
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
            <details>
                <summary>Advanced Options</summary>
                <Stack spacing={2} sx={{ mt: 2 }}>
                    <VisibilitySelector
                        fullWidth
                        value={visibleTo}
                        onChange={setVisibility}
                    />
                    {isEffectStyle(style) && (
                        <BlendModeSelector
                            fullWidth
                            value={getBlendMode(style)}
                            onChange={(blendMode) =>
                                setStyle(
                                    produce(style, (style) => {
                                        if (isEffectStyle(style)) {
                                            style.blendMode = blendMode;
                                        }
                                    }),
                                )
                            }
                        />
                    )}
                </Stack>
            </details>
        </>
    );
}
