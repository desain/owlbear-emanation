import { FormControlProps, MenuItem, Select } from "@mui/material";
import { Layer } from "@owlbear-rodeo/sdk";
import { Control, isLayer, LAYERS } from "owlbear-utils";
import { FC } from "react";

interface LayerSelectorProps {
    value: Layer;
    onChange: (layer: Layer) => void;
}

export const LayerSelector: FC<
    LayerSelectorProps & Omit<FormControlProps, "onChange">
> = ({ value, onChange, ...props }) => (
    <Control {...props} label="Layer">
        <Select
            size="small"
            value={value}
            onChange={(e) => {
                const value = e.target.value;
                if (isLayer(value)) {
                    onChange(value);
                }
            }}
        >
            {LAYERS.map((layer) => (
                <MenuItem key={layer} value={layer}>
                    {layer}
                </MenuItem>
            ))}
        </Select>
    </Control>
);
