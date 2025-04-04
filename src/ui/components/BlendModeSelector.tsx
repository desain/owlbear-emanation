import { FormControlProps, MenuItem, Select } from "@mui/material";
import { BlendMode } from "@owlbear-rodeo/sdk";
import { Control } from "./Control";

const BLEND_MODES: BlendMode[] = [
    "SRC_OVER",
    "CLEAR",
    "SRC",
    "DST",
    "DST_OVER",
    "SRC_IN",
    "DST_IN",
    "SRC_OUT",
    "DST_OUT",
    "SRC_ATOP",
    "DST_ATOP",
    "XOR",
    "PLUS",
    "MODULATE",
    "SCREEN",
    "OVERLAY",
    "DARKEN",
    "LIGHTEN",
    "COLOR_DODGE",
    "COLOR_BURN",
    "HARD_LIGHT",
    "SOFT_LIGHT",
    "DIFFERENCE",
    "EXCLUSION",
    "MULTIPLY",
    "HUE",
    "SATURATION",
    "COLOR",
    "LUMINOSITY",
];

interface BlendModeSelectorProps {
    value: BlendMode;
    onChange: (blendMode: BlendMode) => void;
}

export function BlendModeSelector({
    value,
    onChange,
    ...props
}: BlendModeSelectorProps & Omit<FormControlProps, "onChange">) {
    return (
        <Control {...props} label="Blend Mode">
            <Select
                size="small"
                value={value}
                onChange={(e) => {
                    const value = e.target.value as BlendMode;
                    onChange(value);
                }}
            >
                {BLEND_MODES.map((blendMode) => (
                    <MenuItem key={blendMode} value={blendMode}>
                        {blendMode}
                    </MenuItem>
                ))}
            </Select>
        </Control>
    );
}
