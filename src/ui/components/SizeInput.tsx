import { FormControlProps, InputAdornment } from "@mui/material";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import { GridParsed } from "../../types/GridParsed";
import { Control } from "./Control";

export function SizeInput({
    value,
    onChange,
    grid,
    ...props
}: {
    value: number;
    onChange: (size: number) => void;
    grid: GridParsed;
} & Omit<FormControlProps, "onChange">) {
    const [oldValue, setOldValue] = useState(value);
    const [displayValue, setDisplayValue] = useState(value.toString()); // value that's not necessarily valid

    if (value !== oldValue) {
        setOldValue(value);
        setDisplayValue(value.toString());
    }

    return (
        <Control {...props} label="Size">
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
                    if (Number.isSafeInteger(size) && size > 0) {
                        onChange(size);
                    }
                }}
            />
        </Control>
    );
}
