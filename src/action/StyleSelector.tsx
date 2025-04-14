import { FormControlProps, MenuItem, Select } from "@mui/material";
import { Control } from "owlbear-utils";
import { AuraStyleType, isAuraStyle, STYLE_TYPES } from "../types/AuraStyle";

interface StyleSelectorProps {
    value: AuraStyleType;
    onChange: (styleType: AuraStyleType) => void;
}

export function StyleSelector({
    value,
    onChange,
    ...props
}: StyleSelectorProps & Omit<FormControlProps, "onChange">) {
    return (
        <Control {...props} label="Style">
            <Select
                size="small"
                value={value}
                onChange={(e) => {
                    const value = e.target.value;
                    if (isAuraStyle(value)) {
                        onChange(value);
                    }
                }}
            >
                {...STYLE_TYPES.map((styleType) => (
                    <MenuItem value={styleType}>{styleType}</MenuItem>
                ))}
            </Select>
        </Control>
    );
}
