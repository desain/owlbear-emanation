import OpenWithIcon from "@mui/icons-material/OpenWith";
import { IconButton, Tooltip } from "@mui/material";
import { usePlayerStorage } from "../state/usePlayerStorage";
import { activateTool, deactivateTool } from "../tool/tool";

export const ShiftButton: React.FC = () => {
    const isActive = usePlayerStorage((state) => state.usingShiftMode);

    const handleClick = () => {
        if (isActive) {
            void deactivateTool();
        } else {
            void activateTool();
        }
    };

    return (
        <Tooltip title="Reposition auras">
            <IconButton
                color={isActive ? "primary" : "default"}
                onClick={handleClick}
                sx={{ ml: 1 }}
                size="large"
            >
                <OpenWithIcon />
            </IconButton>
        </Tooltip>
    );
};
