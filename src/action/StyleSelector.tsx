import { FormControlProps, MenuItem, Select } from "@mui/material";
import { Control } from "owlbear-utils";
import { FC } from "react";
import { usePlayerStorage } from "../state/usePlayerStorage";
import {
    AuraStyleType,
    isAuraStyleType,
    STYLE_TYPES,
} from "../types/AuraStyle";

const IS_ADVANCED: Partial<Record<AuraStyleType, boolean>> = {
    Custom: true,
};

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
                    !IS_ADVANCED[styleType] ||
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
