import { FormControlProps } from "@mui/material";
import { useEffect, useState } from "react";
import { Control } from "owlbear-utils";

export function ColorInput({
    value,
    onChange,
    ...props
}: {
    value: string;
    onChange: (value: string) => void;
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
        }, 100);

        return () => clearTimeout(handler); // Clear timeout if color changes within the delay
    }, [value, displayValue, onChange]);

    return (
        <Control {...props} sx={{ alignItems: "center" }} label="Color">
            <label className="color-label" style={{ background: displayValue }}>
                <input
                    type="color"
                    value={displayValue}
                    onInput={(e) => {
                        setDisplayValue(e.currentTarget.value);
                    }}
                />
            </label>
        </Control>
    );
}
