// Custom icon for the GRID layer (no official icon)
import { createSvgIcon } from "@mui/material/utils";
const GridIcon = createSvgIcon(
    <g>
        <rect x="4" y="4" width="16" height="16" rx="4" fill="#E0E0E0" />
        <path
            d="M8 4v16M16 4v16M4 8h16M4 16h16"
            stroke="#757575"
            strokeWidth="1.5"
        />
    </g>,
    "GridIcon",
);
export default GridIcon;
