import Square from "@mui/icons-material/CheckBoxOutlineBlank";
import Circle from "@mui/icons-material/RadioButtonUnchecked";
import type { FormControlProps } from "@mui/material";
import { MenuItem, Select } from "@mui/material";
import { Control } from "owlbear-utils";
import type { FC } from "react";
import type { AuraShape } from "../types/AuraShape";
import { isAuraShape } from "../types/AuraShape";

interface OverrideShapeSelectorProps {
    value: string | undefined;
    onChange: (value: AuraShape | undefined) => void;
}

export const OverrideShapeSelector: FC<
    OverrideShapeSelectorProps & Omit<FormControlProps, "onChange">
> = ({ value, onChange, ...props }) => (
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
            <MenuItem value="circle">
                <Circle
                    fontSize="small"
                    sx={{ verticalAlign: "text-bottom", mr: 1 }}
                />
                Circle
            </MenuItem>
            <MenuItem value="square">
                <Square
                    fontSize="small"
                    sx={{ verticalAlign: "text-bottom", mr: 1 }}
                />
                Square
            </MenuItem>
        </Select>
    </Control>
);
