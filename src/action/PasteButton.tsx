import PasteIcon from "@mui/icons-material/ContentPaste";
import { Button, ButtonProps } from "@mui/material";
import { complain } from "owlbear-utils";
import { FC } from "react";
import { CreateAurasMessage, isCreateAuraMessage } from "../utils/messaging";

type PasteButtonProps = {
    onPaste: (message: CreateAurasMessage) => void;
} & Omit<ButtonProps, "onPaste">;

export const PasteButton: FC<PasteButtonProps> = ({ onPaste, ...props }) => (
    <Button
        {...props}
        variant="outlined"
        startIcon={<PasteIcon />}
        onClick={async () => {
            let clipboardText: string = "";
            try {
                clipboardText = await navigator.clipboard.readText();
                if (!clipboardText) {
                    throw new Error("Clipboard text empty");
                }
            } catch (e) {
                complain("Failed to read clipboard text");
                console.log(e);
                return;
            }

            try {
                const parsed: unknown = JSON.parse(clipboardText);
                if (isCreateAuraMessage(parsed)) {
                    onPaste(parsed);
                } else {
                    throw new Error("Invalid message format");
                }
            } catch (e) {
                complain("Failed to parse clipboard contents");
                console.log(e);
            }
        }}
    >
        Paste
    </Button>
);
