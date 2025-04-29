// Icon source: Custom generic icon for layers without a specific icon
import { createSvgIcon } from "@mui/material/utils";
const GenericLayerIcon = createSvgIcon(
  <g>
    <rect x="4" y="4" width="16" height="16" rx="4" fill="#BDBDBD" />
    <path d="M8 12h8M8 16h8" stroke="#757575" strokeWidth="1.5" strokeLinecap="round" />
  </g>,
  "GenericLayerIcon"
);
export default GenericLayerIcon;
