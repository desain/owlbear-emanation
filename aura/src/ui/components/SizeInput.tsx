import { FormControlProps, InputAdornment } from '@mui/material';
import TextField from '@mui/material/TextField';
import React from 'react';
import { GridParsed } from '../GridParsed';
import { Control } from './Control';

export function SizeInput({ value, onChange, grid, ...props }: {
    value: number,
    onChange: (size: number) => void,
    grid: GridParsed,
} & FormControlProps) {
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
                value={value}
                onChange={e => {
                    const size = parseFloat(e.currentTarget.value);
                    if (Number.isSafeInteger(size) && size > 0) { // TODO real validation
                        onChange(size);
                    }
                }}
            />
        </Control>
    );
}