import { Stack } from "@mui/material";
import { produce } from "immer";
import { AuraConfig } from "../types/AuraConfig";
import {
    getBlendMode,
    getColor,
    getOpacity,
    isColorOpacityShaderStyle,
    isEffectStyle,
    isImageStyle,
    isSimpleStyle,
    setColor,
    setOpacity,
    setStyleType,
} from "../types/AuraStyle";
import { BlendModeSelector } from "./BlendModeSelector";
import { ColorInput } from "./ColorInput";
import { ImageSelector } from "./ImageSelector";
import { OpacitySlider } from "./OpacitySlider";
import { SizeInput } from "./SizeInput";
import { StyleSelector } from "./StyleSelector";
import { VisibilitySelector } from "./VisibilitySelector";

export function AuraConfigEditor({
    config,
    setStyle,
    setSize,
    setVisibility,
}: {
    config: AuraConfig;
    setStyle: (style: AuraConfig["style"]) => void;
    setSize: (size: AuraConfig["size"]) => void;
    setVisibility: (visibleTo: AuraConfig["visibleTo"]) => void;
}) {
    const hasColorOpacityControls =
        isSimpleStyle(config.style) || isColorOpacityShaderStyle(config.style);

    return (
        <>
            <Stack direction="row" gap={1} sx={{ mb: 2 }}>
                <StyleSelector
                    fullWidth
                    value={config.style.type}
                    onChange={(styleType) =>
                        setStyle(setStyleType(config.style, styleType))
                    }
                />
                <SizeInput value={config.size} onChange={setSize} />
            </Stack>
            {hasColorOpacityControls && (
                <Stack direction="row" gap={1} sx={{ mb: 2 }}>
                    <ColorInput
                        value={getColor(config.style)}
                        onChange={(color) =>
                            setStyle(
                                produce(config.style, (style) => {
                                    setColor(style, color);
                                }),
                            )
                        }
                    />
                    <OpacitySlider
                        sx={{ flexGrow: 1 }}
                        value={getOpacity(config.style)}
                        onChange={(opacity) =>
                            setStyle(
                                produce(config.style, (style) => {
                                    setOpacity(style, opacity);
                                }),
                            )
                        }
                    />
                </Stack>
            )}
            {isImageStyle(config.style) && (
                <Stack sx={{ mb: 2 }}>
                    <ImageSelector
                        value={config.style}
                        onChange={(imageBuildParams) =>
                            setStyle({
                                type: "Image",
                                ...imageBuildParams,
                            })
                        }
                    />
                </Stack>
            )}
            <details>
                <summary>Advanced Options</summary>
                <Stack spacing={2} sx={{ mt: 2 }}>
                    <VisibilitySelector
                        fullWidth
                        value={config.visibleTo}
                        onChange={setVisibility}
                    />
                    {isEffectStyle(config.style) && (
                        <BlendModeSelector
                            fullWidth
                            value={getBlendMode(config.style)}
                            onChange={(blendMode) =>
                                setStyle(
                                    produce(config.style, (style) => {
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
