import { FormControlProps, MenuItem, Select } from "@mui/material";
import { AuraShape, isAuraShape } from "../../types/AuraShape";
import { Control } from "./Control";

interface OverrideShapeSelectorProps {
    value: string | undefined;
    onChange: (value: AuraShape | undefined) => void;
}

export function OverrideShapeSelector({
    value,
    onChange,
    ...props
}: OverrideShapeSelectorProps & Omit<FormControlProps, "onChange">) {
    return (
        <Control {...props} label="Override Shape" fullWidth>
            <Select
                size="small"
                value={value ?? "none"}
                onChange={(event) => {
                    const value = event.target.value;
                    onChange(isAuraShape(value) ? value : undefined);
                }}
            >
                <MenuItem value="none">
                    <em>No Override</em>
                </MenuItem>
                <MenuItem value="circle">Circle</MenuItem>
                <MenuItem value="square">Square</MenuItem>
            </Select>
        </Control>
    );
}
