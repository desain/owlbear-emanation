import type { FormControlProps } from "@mui/material";
import { InputAdornment } from "@mui/material";
import TextField from "@mui/material/TextField";
import { Control, units, type Units } from "owlbear-utils";
import { useState } from "react";
import { usePlayerStorage } from "../state/usePlayerStorage";

export function SizeInput({
    value,
    onChange,
    ...props
}: {
    value: Units;
    onChange: (size: Units) => void;
} & Omit<FormControlProps, "onChange">) {
    const grid = usePlayerStorage((state) => state.grid);
    const [oldValue, setOldValue] = useState(value);
    const [displayValue, setDisplayValue] = useState(value.toString()); // value that's not necessarily valid

    if (value !== oldValue) {
        setOldValue(value);
        setDisplayValue(value.toString());
    }

    return (
        <Control
            {...props}
            sx={{
                /*maxWidth: 90, minWidth: 90*/
                width: 140,
            }}
            label="Size"
        >
            <TextField
                type="number"
                size="small"
                slotProps={{
                    htmlInput: {
                        min: grid.parsedScale.multiplier,
                        step: grid.parsedScale.multiplier,
                    },
                    input: {
                        endAdornment: (
                            <InputAdornment position="end">
                                {grid.parsedScale.unit}
                            </InputAdornment>
                        ),
                    },
                }}
                value={displayValue}
                onChange={(e) => {
                    setDisplayValue(e.currentTarget.value);
                    const size = parseFloat(e.currentTarget.value);
                    if (
                        Number.isFinite(size) &&
                        !Number.isNaN(size) &&
                        size >= 0
                    ) {
                        onChange(units(size));
                    }
                }}
            />
        </Control>
    );
}
