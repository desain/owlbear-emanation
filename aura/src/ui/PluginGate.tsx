// Adapted from https://github.com/owlbear-rodeo/weather/blob/main/src/menu/util/PluginGate.tsx

import OBR from "@owlbear-rodeo/sdk";
import React, { useEffect, useState } from "react";

/**
 * Only render the children when we're within a plugin,
 * that plugin is ready, and the OBR scene is ready.
 */
export function PluginGate({ children }: { children: React.ReactNode }) {
    const [ready, setReady] = useState(false);
    const [sceneReady, setSceneReady] = useState(false);

    useEffect(() => {
        if (OBR.isAvailable) {
            OBR.onReady(() => {
                setReady(true);
                OBR.scene.isReady().then(setSceneReady);
            });
        }
    }, []);

    useEffect(() => {
        if (ready) {
            return OBR.scene.onReadyChange(setSceneReady);
        }
    }, [ready]);

    if (ready && sceneReady) {
        return <>{children}</>;
    } else {
        return null;
    }
}