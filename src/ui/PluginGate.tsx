// Adapted from https://github.com/owlbear-rodeo/weather/blob/main/src/menu/util/PluginGate.tsx

import OBR from "@owlbear-rodeo/sdk";
import React, { useEffect, useState } from "react";

/**
 * Only render the children when we're within a plugin,
 * that plugin is ready, and the OBR scene is ready.
 */
export function PluginGate({
    alt = <p>Loading scene data</p>,
    children,
}: {
    alt?: React.ReactNode;
    children: React.ReactNode;
}) {
    const [ready, setReady] = useState(false);
    const [sceneReady, setSceneReady] = useState(false);

    useEffect(() => {
        if (OBR.isAvailable) {
            OBR.onReady(async () => {
                setReady(true);
                setSceneReady(await OBR.scene.isReady());
            });
        }
    }, []);

    useEffect(() => {
        if (ready) {
            return OBR.scene.onReadyChange(setSceneReady);
        }
        return;
    }, [ready]);

    if (ready && sceneReady) {
        return <>{children}</>;
    } else {
        return alt;
    }
}
