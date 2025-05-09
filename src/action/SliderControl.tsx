import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import { Control } from "owlbear-utils";
import React, { useEffect, useState } from "react";

interface SliderControlProps {
    value: number;
    onChange: (value: number) => void;
    label: string;
    icon?: React.ReactNode;
}

export const SliderControl: React.FC<SliderControlProps> = ({
    value,
    onChange,
    label,
    icon,
}) => {
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
        setDisplayValue(value);
    }, [value]);

    return (
        <Control sx={{ flexGrow: 1 }} label={label}>
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
                    onChange={(_, value) => {
                        setDisplayValue(value);
                    }} // really onInput
                    onChangeCommitted={() => {
                        // don't use the new value parameter here since it has wrong values
                        // sometimes when you click and drag outside the iframe.
                        onChange(displayValue);
                    }}
                />
                {icon}
            </Box>
        </Control>
    );
};
