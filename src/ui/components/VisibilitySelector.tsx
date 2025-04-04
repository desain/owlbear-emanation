import { FormControlProps, MenuItem, Select } from "@mui/material";
import { useOwlbearStore } from "../../useOwlbearStore";
import { Control } from "./Control";

const EVERYONE = "everyone";

interface VisibilitySelectorProps {
    onChange: (value: string | undefined) => void;
    value: string | undefined;
}

export function VisibilitySelector({
    onChange,
    value,
    ...props
}: VisibilitySelectorProps & Omit<FormControlProps, "onChange">) {
    const playerId = useOwlbearStore((store) => store.playerId);
    const currentlyVisibleToOther = value && value !== playerId;
    return (
        <Control {...props} label="Visible to">
            <Select
                size="small"
                value={value ?? EVERYONE}
                onChange={(e) => {
                    const value = e.target.value;
                    onChange(value === EVERYONE ? undefined : value);
                }}
            >
                <MenuItem value={EVERYONE}>Visible to Everyone</MenuItem>
                <MenuItem value={playerId}>Visible to Only Me</MenuItem>
                {currentlyVisibleToOther && (
                    <MenuItem disabled value={value}>
                        <em>Other Player</em>
                    </MenuItem>
                )}
            </Select>
        </Control>
    );
}
