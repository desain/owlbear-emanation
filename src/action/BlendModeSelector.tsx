import { FormControlProps, MenuItem, Select } from "@mui/material";
import { BlendMode } from "@owlbear-rodeo/sdk";
import { BLEND_MODES, Control, isBlendMode } from "owlbear-utils";

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
                    const value = e.target.value;
                    if (isBlendMode(value)) {
                        onChange(value);
                    }
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
