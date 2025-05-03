import type { FormControlProps} from "@mui/material";
import { MenuItem, Select } from "@mui/material";
import type { Layer } from "@owlbear-rodeo/sdk";
import { Control, isLayer, LAYERS } from "owlbear-utils";
import type { FC } from "react";
import { usePlayerStorage } from "../state/usePlayerStorage";
import { LAYER_ICONS } from "./layerIcons";

interface LayerSelectorProps {
    value: Layer;
    onChange: (layer: Layer) => void;
}

const LAYER_NAMES = LAYERS.map((layer) =>
    layer
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
);

export const LayerSelector: FC<
    LayerSelectorProps & Omit<FormControlProps, "onChange">
> = ({ value, onChange, ...props }) => {
    const showAdvancedOptions = usePlayerStorage(
        (store) => store.showAdvancedOptions,
    );
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
                {LAYERS.map((layer, i) => {
                    const { icon: Icon, isAdvanced } = LAYER_ICONS[layer];

                    // Don't show advanced layers unless they're selected
                    if (isAdvanced && !showAdvancedOptions && value !== layer) {
                        return null;
                    }

                    return (
                        <MenuItem key={layer} value={layer}>
                            <Icon
                                style={{
                                    marginRight: 8,
                                    verticalAlign: "middle",
                                }}
                            />

                            {LAYER_NAMES[i]}
                        </MenuItem>
                    );
                })}
            </Select>
        </Control>
    );
};
