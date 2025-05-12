import OpacityIcon from "@mui/icons-material/Opacity";
import StormIcon from "@mui/icons-material/Storm";
import { Stack } from "@mui/material";
import { produce } from "immer";
import type { AuraConfig } from "../types/AuraConfig";
import { getLayer } from "../types/AuraConfig";
import {
    getBlendMode,
    getColor,
    getOpacity,
    getWarpFactor,
    isColorOpacityShaderStyle,
    isCustomEffectStyle,
    isDistortStyle,
    isEffectStyle,
    isImageStyle,
    isPostProcessStyle,
    isSimpleStyle,
    setColor,
    setOpacity,
    setStyleType,
    supportsOverrideShape,
} from "../types/AuraStyle";
import { BlendModeSelector } from "./BlendModeSelector";
import { ColorInput } from "./ColorInput";
import { CustomShaderInput } from "./CustomShaderInput";
import { ImageSelector } from "./ImageSelector";
import { LayerSelector } from "./LayerSelector";
import { OverrideShapeSelector } from "./OverrideShapeSelector";
import { SizeInput } from "./SizeInput";
import { SliderControl } from "./SliderControl";
import { StyleSelector } from "./StyleSelector";
import { VisibilitySelector } from "./VisibilitySelector";

export function AuraConfigEditor({
    config,
    setStyle,
    setSize,
    setVisibility,
    setLayer,
    setShapeOverride,
}: {
    config: AuraConfig;
    setStyle: (style: AuraConfig["style"]) => void;
    setSize: (size: AuraConfig["size"]) => void;
    setVisibility: (visibleTo: AuraConfig["visibleTo"]) => void;
    setLayer: (layer: NonNullable<AuraConfig["layer"]>) => void;
    setShapeOverride: (shapeOverride: AuraConfig["shapeOverride"]) => void;
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
                    <SliderControl
                        label="Opacity"
                        icon={<OpacityIcon color="disabled" />}
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
            {isCustomEffectStyle(config.style) && (
                <CustomShaderInput
                    value={config.style.sksl}
                    onChange={(sksl) =>
                        setStyle(
                            produce(config.style, (style) => {
                                if (style.type === "Custom") {
                                    style.sksl = sksl;
                                }
                            }),
                        )
                    }
                />
            )}
            {isDistortStyle(config.style) && (
                <Stack direction="row">
                    <SliderControl
                        label="Warp Factor"
                        icon={<StormIcon color="disabled" />}
                        value={getWarpFactor(config.style)}
                        onChange={(warpFactor) => {
                            setStyle(
                                produce(config.style, (style) => {
                                    if (isDistortStyle(style)) {
                                        style.warpFactor = warpFactor;
                                    }
                                }),
                            );
                        }}
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
                    <LayerSelector
                        fullWidth
                        value={getLayer(config)}
                        onChange={setLayer}
                        disabled={isPostProcessStyle(config.style.type)}
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
                    {supportsOverrideShape(config.style.type) && (
                        <OverrideShapeSelector
                            fullWidth
                            value={config.shapeOverride}
                            onChange={setShapeOverride}
                        />
                    )}
                </Stack>
            </details>
        </>
    );
}
