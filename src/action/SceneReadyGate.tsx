import HourglassIcon from "@mui/icons-material/HourglassEmpty";
import { Alert } from "@mui/material";
import { usePlayerStorage } from "../state/usePlayerStorage";

/**
 * Gate that only renders its children when the OBR scene is ready
 */
export function SceneReadyGate({ children }: { children: React.ReactNode }) {
    const sceneReady = usePlayerStorage((store) => store.sceneReady);

    if (sceneReady) {
        return <>{children}</>;
    } else {
        return (
            <Alert icon={<HourglassIcon />} severity="warning" sx={{ mt: 2 }}>
                Waiting for scene...
            </Alert>
        );
    }
}
