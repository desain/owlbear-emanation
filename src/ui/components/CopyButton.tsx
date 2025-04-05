import CopyIcon from "@mui/icons-material/ContentCopy";
import { Button } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { getColor, getOpacity } from "../../types/AuraStyle";
import { AuraEntry } from "../../types/metadata/SourceMetadata";
import { CreateAurasMessage } from "../../utils/messaging";

async function copyToClipboard(message: CreateAurasMessage) {
    try {
        await navigator.clipboard.writeText(JSON.stringify(message));
        await OBR.notification.show(
            "Copied aura style settings to clipboard",
            "SUCCESS",
        );
    } catch (error) {
        await OBR.notification.show(
            "Failed to copy aura style settings to clipboard",
            "ERROR",
        );
    }
}

type CopyButtonProps = Pick<AuraEntry, "size" | "style" | "visibleTo">;

export function CopyButton({ size, style, visibleTo }: CopyButtonProps) {
    return (
        <Button
            aria-label="copy"
            startIcon={<CopyIcon />}
            onClick={() => {
                const message: CreateAurasMessage = {
                    type: "CREATE_AURAS",
                    sources: [],
                    size: size,
                    style: style.type,
                    color: getColor(style),
                    opacity: getOpacity(style),
                    visibleTo: visibleTo,
                };
                copyToClipboard(message);
            }}
        >
            Copy to Clipboard
        </Button>
    );
}
