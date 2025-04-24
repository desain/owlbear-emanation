import { FormControlProps, MenuItem, Select } from "@mui/material";
import { Control } from "owlbear-utils";
import { FC } from "react";
import {
    AuraStyleType,
    isAuraStyleType,
    STYLE_TYPES,
} from "../types/AuraStyle";

interface StyleSelectorProps {
    value: AuraStyleType;
    onChange: (styleType: AuraStyleType) => void;
}

export const StyleSelector: FC<
    StyleSelectorProps & Omit<FormControlProps, "onChange">
> = ({ value, onChange, ...props }) => (
    <Control {...props} label="Style">
        <Select
            size="small"
            value={value}
            onChange={(e) => {
                const value = e.target.value;
                if (isAuraStyleType(value)) {
                    onChange(value);
                }
            }}
        >
            {STYLE_TYPES.map((styleType) => (
                <MenuItem key={styleType} value={styleType}>
                    {styleType}
                </MenuItem>
            ))}
        </Select>
    </Control>
);
