import CopyIcon from "@mui/icons-material/ContentCopy";
import { Button } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { AuraConfig, getLayer } from "../types/AuraConfig";
import {
    getBlendMode,
    getColor,
    getImageBuildParams,
    getOpacity,
} from "../types/AuraStyle";
import { CreateAurasMessage } from "../utils/messaging";

async function copyToClipboard(message: CreateAurasMessage) {
    try {
        await navigator.clipboard.writeText(JSON.stringify(message));
        await OBR.notification.show(
            "Copied aura style settings to clipboard",
            "SUCCESS",
        );
    } catch {
        await OBR.notification.show(
            "Failed to copy aura style settings to clipboard",
            "ERROR",
        );
    }
}

export function CopyButton({ config }: { config: AuraConfig }) {
    return (
        <Button
            startIcon={<CopyIcon />}
            onClick={async () => {
                const message: CreateAurasMessage = {
                    type: "CREATE_AURAS",
                    sources: [],
                    size: config.size,
                    style: config.style.type,
                    color: getColor(config.style),
                    opacity: getOpacity(config.style),
                    visibleTo: config.visibleTo,
                    layer: getLayer(config),
                    blendMode: getBlendMode(config.style),
                    imageBuildParams: getImageBuildParams(config.style),
                };
                await copyToClipboard(message);
            }}
        >
            Copy to Clipboard
        </Button>
    );
}
