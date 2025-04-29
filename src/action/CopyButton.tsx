import CopyIcon from "@mui/icons-material/ContentCopy";
import { Button } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { complain } from "owlbear-utils";
import { FC } from "react";
import { AuraConfig, getLayer } from "../types/AuraConfig";
import {
    getBlendMode,
    getColor,
    getImageBuildParams,
    getOpacity,
    isCustomEffectStyle,
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
        complain("Failed to copy aura style settings to clipboard");
    }
}

export const CopyButton: FC<{ config: AuraConfig }> = ({ config }) => (
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
                sksl: isCustomEffectStyle(config.style)
                    ? config.style.sksl
                    : undefined,
            };
            await copyToClipboard(message);
        }}
    >
        Copy to Clipboard
    </Button>
);
