import type { FormControlProps } from "@mui/material";
import type { HexColor } from "owlbear-utils";
import { assumeHexColor, Control } from "owlbear-utils";
import { useEffect, useState } from "react";

const UPDATE_DELAY_MS = 100;

export function ColorInput({
    value,
    onChange,
    ...props
}: {
    value: HexColor;
    onChange: (value: HexColor) => void;
} & Omit<FormControlProps, "onChange">) {
    const [oldValue, setOldValue] = useState(value);
    const [displayValue, setDisplayValue] = useState(value);

    if (value !== oldValue) {
        setOldValue(value);
        setDisplayValue(value);
    }

    // Ughhhhhh
    // React breaks the dom 'onchange' event, which is the behavior I want.
    // React makes it behave the same as 'oninput', which fires constantly while the user is using the selector.
    // That breaks OBR since it creates too many API calls.
    // So work around that by debouncing the input, so it at least doesn't fire all the time
    useEffect(() => {
        const handler = setTimeout(() => {
            if (displayValue !== value) {
                onChange(displayValue);
            }
        }, UPDATE_DELAY_MS);

        return () => clearTimeout(handler); // Clear timeout if color changes within the delay
    }, [value, displayValue, onChange]);

    return (
        <Control {...props} sx={{ alignItems: "center" }} label="Color">
            <label className="color-label" style={{ background: displayValue }}>
                <input
                    type="color"
                    value={displayValue}
                    onInput={(e) => {
                        setDisplayValue(assumeHexColor(e.currentTarget.value));
                    }}
                />
            </label>
        </Control>
    );
}
