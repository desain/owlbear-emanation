import HourglassIcon from "@mui/icons-material/HourglassEmpty";
import { Alert } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";

/**
 * Gate that only renders its children when the OBR scene is ready
 */
export function SceneReadyGate({ children }: { children: React.ReactNode }) {
    const [sceneReady, setSceneReady] = useState(false);

    useEffect(() => {
        void OBR.scene.isReady().then(setSceneReady);
        return OBR.scene.onReadyChange(setSceneReady);
    }, []);

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
