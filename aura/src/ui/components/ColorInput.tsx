import { FormControlProps } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Control } from './Control';

export function ColorInput({ value, onChange, ...props }: {
    value: string,
    onChange: (value: string) => void,
} & FormControlProps) {
    const [color, setColor] = useState(value);

    // Ughhhhhh
    // React breaks the dom 'onchange' event, which is the behavior I want.
    // React makes it behave the same as 'oninput', which fires constantly while the user is using the selector.
    // That breaks OBR since it creates too many API calls.
    // So work around that by debouncing the input, so it at least doesn't fire all the time
    useEffect(() => {
        const handler = setTimeout(() => {
            if (color !== value) {
                onChange(color);
            }
        }, 100);

        return () => {
            clearTimeout(handler); // Clear timeout if color changes within the delay
        };
    }, [color]);

    return (
        <Control {...props} label="Color">
            <label className="color-label" style={{ background: color }}>
                <input type="color"
                    value={color}
                    onInput={e => {
                        setColor(e.currentTarget.value);
                    }}
                />
            </label>
        </Control>
    );
}