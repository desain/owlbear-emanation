import DisabledVisible from "@mui/icons-material/DisabledVisible";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import type { FormControlProps } from "@mui/material";
import { MenuItem, Select } from "@mui/material";
import { Control } from "owlbear-utils";
import { usePlayerStorage } from "../state/usePlayerStorage";

const EVERYONE = "everyone";
const NOBODY = "nobody";

interface VisibilitySelectorProps {
    onChange: (value: string | null | undefined) => void;
    value: string | null | undefined;
}

export function VisibilitySelector({
    onChange,
    value,
    ...props
}: VisibilitySelectorProps & Omit<FormControlProps, "onChange">) {
    const playerId = usePlayerStorage((store) => store.playerId);
    const textValue = value ?? (value === undefined ? EVERYONE : NOBODY);
    const currentlyVisibleToOther = value && value !== playerId;
    return (
        <Control {...props} label="Visibility">
            <Select
                size="small"
                value={textValue}
                onChange={(e) => {
                    const value = e.target.value;
                    onChange(
                        value === EVERYONE
                            ? undefined
                            : value === NOBODY
                            ? null
                            : value,
                    );
                }}
            >
                <MenuItem value={EVERYONE}>
                    <Visibility
                        style={{
                            marginRight: 8,
                            verticalAlign: "middle",
                        }}
                    />
                    Visible to Everyone
                </MenuItem>
                <MenuItem value={playerId}>
                    <DisabledVisible
                        style={{
                            marginRight: 8,
                            verticalAlign: "middle",
                        }}
                    />
                    Visible to Only Me
                </MenuItem>
                <MenuItem value={NOBODY}>
                    <VisibilityOff
                        style={{
                            marginRight: 8,
                            verticalAlign: "middle",
                        }}
                    />
                    Invisible
                </MenuItem>
                {currentlyVisibleToOther && (
                    <MenuItem disabled value={value}>
                        <em>Visible to Another Player</em>
                    </MenuItem>
                )}
            </Select>
        </Control>
    );
}
