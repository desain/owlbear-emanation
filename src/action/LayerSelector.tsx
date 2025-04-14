import { FormControlProps, MenuItem, Select } from "@mui/material";
import { Layer } from "@owlbear-rodeo/sdk";
import { isLayer, LAYERS } from "../utils/obrTypeUtils";
import { Control } from "./Control";

interface LayerSelectorProps {
    value: Layer;
    onChange: (layer: Layer) => void;
}

export function LayerSelector({
    value,
    onChange,
    ...props
}: LayerSelectorProps & Omit<FormControlProps, "onChange">) {
    return (
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
}
