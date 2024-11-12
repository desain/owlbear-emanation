import OpacityIcon from '@mui/icons-material/Opacity';
import Box from '@mui/material/Box';
import { FormControlProps } from '@mui/material/FormControl';
import Slider from '@mui/material/Slider';
import React, { useState } from 'react';
import { Control } from './Control';

export function OpacitySlider({ value, onChange, ...props }: {
    value: number,
    onChange: (opacity: number) => void,
} & FormControlProps) {
    const [opacity, setOpacity] = useState(value);
    return (
        <Control {...props} label="Opacity">
            <Box sx={{ display: 'flex', alignItems: 'center', paddingLeft: 2, height: 40, }}>
                <Slider
                    sx={{ mr: 1 }}
                    min={0}
                    max={1}
                    step={0.1}
                    valueLabelDisplay="auto"
                    valueLabelFormat={n => `${n * 100}%`}
                    value={opacity}
                    onChange={(_, opacity) => setOpacity(opacity as number)} // really onInput
                    onChangeCommitted={(_, finalOpacity) => onChange(finalOpacity as number)}
                />
                <OpacityIcon color='disabled' />
            </Box>
        </Control>
    );
}