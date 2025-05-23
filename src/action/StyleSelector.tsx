import type { FormControlProps } from "@mui/material";
import { MenuItem, Select } from "@mui/material";
import { Control } from "owlbear-utils";
import type { FC } from "react";
import { usePlayerStorage } from "../state/usePlayerStorage";
import type { AuraStyleType } from "../types/AuraStyle";
import { isAuraStyleType, STYLE_TYPES } from "../types/AuraStyle";

const ADVANCED_STYLES = new Set<AuraStyleType>(["Custom", "Solid"]);

interface StyleSelectorProps {
    value: AuraStyleType;
    onChange: (styleType: AuraStyleType) => void;
}

export const StyleSelector: FC<
    StyleSelectorProps & Omit<FormControlProps, "onChange">
> = ({ value, onChange, ...props }) => {
    const showAdvancedOptions = usePlayerStorage(
        (store) => store.showAdvancedOptions,
    );
    return (
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
                {STYLE_TYPES.map((styleType) =>
                    showAdvancedOptions ||
                    !ADVANCED_STYLES.has(styleType) ||
                    styleType === value ? (
                        <MenuItem key={styleType} value={styleType}>
                            {styleType}
                        </MenuItem>
                    ) : null,
                )}
            </Select>
        </Control>
    );
};
