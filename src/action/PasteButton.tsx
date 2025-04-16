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
            onClick={async () => {
                const clipboardText = await navigator.clipboard.readText();
                if (clipboardText) {
                    try {
                        const parsed: unknown = JSON.parse(clipboardText);
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
                        void OBR.notification.show(
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
