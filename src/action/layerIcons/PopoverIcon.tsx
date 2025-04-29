// Custom icon for the POPOVER layer (no official icon)
import { createSvgIcon } from "@mui/material/utils";
const PopoverIcon = createSvgIcon(
    <g>
        <rect x="4" y="4" width="16" height="16" rx="4" fill="#FFF3E0" />
        <rect
            x="8"
            y="8"
            width="8"
            height="6"
            rx="2"
            stroke="#F57C00"
            strokeWidth="1.5"
            fill="none"
        />
        <path d="M12 14v4" stroke="#F57C00" strokeWidth="1.5" />
        <circle cx="12" cy="18" r="1" fill="#F57C00" />
    </g>,
    "PopoverIcon",
);
export default PopoverIcon;
