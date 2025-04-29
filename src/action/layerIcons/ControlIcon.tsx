// Custom icon for the CONTROL layer (no official icon)
import { createSvgIcon } from "@mui/material/utils";
const ControlIcon = createSvgIcon(
    <g>
        <rect x="4" y="4" width="16" height="16" rx="4" fill="#E3F2FD" />
        <path d="M8 12h8M12 8v8" stroke="#1976D2" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="2" fill="#1976D2" />
    </g>,
    "ControlIcon",
);
export default ControlIcon;
