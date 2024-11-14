import OpacityIcon from "@mui/icons-material/Opacity";
import Box from "@mui/material/Box";
import { FormControlProps } from "@mui/material/FormControl";
import Slider from "@mui/material/Slider";
import { useState } from "react";
import { Control } from "./Control";

export function OpacitySlider({
    value,
    onChange,
    ...props
}: {
    value: number;
    onChange: (opacity: number) => void;
} & Omit<FormControlProps, "onChange">) {
    const [oldValue, setOldValue] = useState(value);
    // TODO we want to update the component's state when the incoming value changes
    const [displayValue, setDisplayValue] = useState(value);

    if (value !== oldValue) {
        setOldValue(value);
        setDisplayValue(value);
    }

    return (
        <Control {...props} label="Opacity">
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 2,
                    height: 40,
                }}
            >
                <Slider
                    sx={{ mr: 1 }}
                    min={0}
                    max={1}
                    step={0.1}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(n) => `${n * 100}%`}
                    value={displayValue}
                    onChange={(_, opacity) => {
                        setDisplayValue(opacity as number);
                    }} // really onInput
                    onChangeCommitted={() => {
                        // don't use the new value parameter here since it has wrong values
                        // sometimes when you click and drag outside the iframe.
                        onChange(displayValue as number);
                    }}
                />
                <OpacityIcon color="disabled" />
            </Box>
        </Control>
    );
}
