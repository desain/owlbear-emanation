import {
    FormControlProps,
    ListItemText,
    MenuItem,
    Select,
    Typography,
} from "@mui/material";
import { BlendMode } from "@owlbear-rodeo/sdk";
import { BLEND_MODES, Control, isBlendMode } from "owlbear-utils";
import { FC } from "react";
import { usePlayerStorage } from "../state/usePlayerStorage";

const BLEND_MODE_DESCRIPTIONS: Record<
    BlendMode,
    { description: string; isAdvanced: boolean }
> = {
    CLEAR: {
        description: "Clears the destination where the aura is drawn",
        isAdvanced: true,
    },
    SRC: {
        description: "Only the aura is drawn, ignoring the background",
        isAdvanced: true,
    },
    DST: {
        description: "Only the background is drawn, ignoring the aura",
        isAdvanced: true,
    },
    SRC_OVER: {
        description: "Default: Draws aura on top of background",
        isAdvanced: false,
    },
    DST_OVER: {
        description: "Draws background on top of aura",
        isAdvanced: true,
    },
    SRC_IN: {
        description: "Shows aura only where it overlaps the background",
        isAdvanced: true,
    },
    DST_IN: {
        description: "Shows background only where it overlaps the aura",
        isAdvanced: true,
    },
    SRC_OUT: {
        description: "Shows aura only where it does not overlap the background",
        isAdvanced: true,
    },
    DST_OUT: {
        description: "Shows background only where it does not overlap the aura",
        isAdvanced: true,
    },
    SRC_ATOP: {
        description:
            "Draws aura only where it overlaps the background, background elsewhere",
        isAdvanced: true,
    },
    DST_ATOP: {
        description:
            "Draws background only where it overlaps the aura, aura elsewhere",
        isAdvanced: true,
    },
    XOR: {
        description: "Shows aura and background only where they do not overlap",
        isAdvanced: true,
    },
    PLUS: {
        description: "Adds aura and background colors (brighten)",
        isAdvanced: false,
    },
    MODULATE: {
        description: "Multiplies aura and background colors",
        isAdvanced: true,
    },
    SCREEN: {
        description: "Lightens by inverting, multiplying, and inverting again",
        isAdvanced: false,
    },
    OVERLAY: {
        description: "Combines multiply and screen for contrast",
        isAdvanced: false,
    },
    DARKEN: {
        description: "Keeps the darker color",
        isAdvanced: true,
    },
    LIGHTEN: {
        description: "Keeps the lighter color",
        isAdvanced: true,
    },
    COLOR_DODGE: {
        description:
            "Divides the background layer by the inverted aura layer (brighten)",
        isAdvanced: false,
    },
    COLOR_BURN: {
        description:
            "Divides the inverted background layer by the aura layer, and then inverts the result (darken)",
        isAdvanced: false,
    },
    HARD_LIGHT: {
        description: "Combines multiply and screen based on aura",
        isAdvanced: true,
    },
    SOFT_LIGHT: {
        description: "Softly combines aura and background",
        isAdvanced: true,
    },
    DIFFERENCE: {
        description: "Subtracts darker color from lighter",
        isAdvanced: true,
    },
    EXCLUSION: {
        description: "Similar to difference but lower contrast",
        isAdvanced: true,
    },
    MULTIPLY: {
        description: "Multiplies aura and background colors (darken)",
        isAdvanced: false,
    },
    HUE: {
        description:
            "Uses the hue of the aura and the saturation/luminosity of the background",
        isAdvanced: false,
    },
    SATURATION: {
        description:
            "Uses the saturation of the aura and the hue/luminosity of the background",
        isAdvanced: false,
    },
    COLOR: {
        description:
            "Uses the color of the aura and the luminosity of the background",
        isAdvanced: false,
    },
    LUMINOSITY: {
        description:
            "Uses the luminosity of the aura and the color of the background",
        isAdvanced: false,
    },
};

interface BlendModeSelectorProps {
    value: BlendMode;
    onChange: (blendMode: BlendMode) => void;
}

export const BlendModeSelector: FC<
    BlendModeSelectorProps & Omit<FormControlProps, "onChange">
> = ({ value, onChange, ...props }) => {
    const showAdvancedOptions = usePlayerStorage(
        (store) => store.showAdvancedOptions,
    );
    return (
        <Control {...props} label="Blend Mode">
            <Select
                size="small"
                value={value}
                onChange={(e) => {
                    const value = e.target.value;
                    if (isBlendMode(value)) {
                        onChange(value);
                    }
                }}
            >
                {BLEND_MODES.filter(
                    (blendMode) =>
                        showAdvancedOptions ||
                        !BLEND_MODE_DESCRIPTIONS[blendMode].isAdvanced ||
                        value === blendMode,
                ).map((blendMode) => (
                    <MenuItem key={blendMode} value={blendMode}>
                        <ListItemText
                            primary={blendMode}
                            secondary={
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        whiteSpace: "normal",
                                        wordBreak: "break-word",
                                        maxWidth: 320,
                                    }}
                                >
                                    {
                                        BLEND_MODE_DESCRIPTIONS[blendMode]
                                            .description
                                    }
                                </Typography>
                            }
                            primaryTypographyProps={{ sx: { fontWeight: 500 } }}
                        />
                    </MenuItem>
                ))}
            </Select>
        </Control>
    );
};
