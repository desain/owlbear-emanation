import PasteIcon from "@mui/icons-material/ContentPaste";
import { Button, ButtonProps } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { MESSAGE_CHANNEL } from "../../constants";
import { isCreateAuraMessage } from "../../utils/messaging";

function PasteButton(props: ButtonProps) {
    return (
        <Button
            variant="outlined"
            startIcon={<PasteIcon />}
            onClick={async () => {
                const clipboardText = prompt(
                    "Paste here (this extension doesn't have permission to read your clipboard directly)",
                );
                if (clipboardText) {
                    try {
                        const parsed = JSON.parse(clipboardText);
                        if (isCreateAuraMessage(parsed)) {
                            const message = {
                                ...parsed,
                                sources: await OBR.player.getSelection(),
                            };
                            await OBR.broadcast.sendMessage(
                                MESSAGE_CHANNEL,
                                message,
                                {
                                    destination: "LOCAL",
                                },
                            );
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
            {...props}
        >
            Paste
        </Button>
    );
}

export default PasteButton;
