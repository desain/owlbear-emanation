import PasteIcon from "@mui/icons-material/ContentPaste";
import { Button, ButtonProps } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { CreateAurasMessage, isCreateAuraMessage } from "../utils/messaging";

type PasteButtonProps = {
    onPaste: (message: CreateAurasMessage) => void;
} & Omit<ButtonProps, "onPaste">;

export function PasteButton({ onPaste, ...props }: PasteButtonProps) {
    return (
        <Button
            {...props}
            variant="outlined"
            startIcon={<PasteIcon />}
            onClick={() => {
                const clipboardText = prompt(
                    "Paste here (this extension doesn't have permission to read your clipboard directly)",
                );
                if (clipboardText) {
                    try {
                        const parsed = JSON.parse(clipboardText);
                        if (isCreateAuraMessage(parsed)) {
                            onPaste(parsed);
                        } else {
                            throw new Error("Invalid message format");
                        }
                    } catch (error) {
                        console.error(
                            "Failed to parse clipboard contents",
                            error,
                        );
                        OBR.notification.show(
                            "Failed to parse clipboard contents",
                            "ERROR",
                        );
                    }
                }
            }}
        >
            Paste
        </Button>
    );
}
