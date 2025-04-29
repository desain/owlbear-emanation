// Custom icon for the POST_PROCESS layer (no official icon)
import { createSvgIcon } from "@mui/material/utils";
const PostProcessIcon = createSvgIcon(
    <g>
        <rect x="4" y="4" width="16" height="16" rx="4" fill="#F3E5F5" />
        <circle
            cx="12"
            cy="12"
            r="5"
            stroke="#8E24AA"
            strokeWidth="1.5"
            fill="none"
        />
        <path d="M12 7v10M7 12h10" stroke="#8E24AA" strokeWidth="1.5" />
    </g>,
    "PostProcessIcon",
);
export default PostProcessIcon;
