import OBR from "@owlbear-rodeo/sdk";
import { deferCallAll, ExtensionWrapper } from "owlbear-utils";
import React from "react";
import ReactDOM from "react-dom/client";
import "../../assets/style.css";
import { version } from "../../package.json";
import AuraFixer from "../AuraFixer";
import { CHANNEL_MESSAGE } from "../constants";
import { startSyncing } from "../state/startSyncing";
import { usePlayerStorage } from "../state/usePlayerStorage";
import { handleMessage } from "../utils/messaging";
import { Action } from "./Action";
import { startWatchingContextMenuEnabled } from "./createContextMenu";

function installBroadcastListener() {
    return OBR.broadcast.onMessage(CHANNEL_MESSAGE, ({ data }) =>
        handleMessage(data),
    );
}

async function installExtension(): Promise<VoidFunction> {
    console.log(`Auras and Emanations version ${version}`);

    const stopWatchingContextMenu = await startWatchingContextMenuEnabled();
    const [, uninstallFixer] = await AuraFixer.install();
    const uninstallBroadcastListener = installBroadcastListener();

    return deferCallAll(
        () => console.log("Uninstalling Auras and Emanations"),
        stopWatchingContextMenu,
        uninstallFixer,
        uninstallBroadcastListener,
    );
}

document.addEventListener("DOMContentLoaded", () => {
    const root = ReactDOM.createRoot(document.getElementById("reactApp")!);
    root.render(
        <React.StrictMode>
            <ExtensionWrapper
                startSyncing={startSyncing}
                useStoreFn={usePlayerStorage}
            >
                <Action />
            </ExtensionWrapper>
        </React.StrictMode>,
    );
});

OBR.onReady(async () => {
    // console.log("onReady");
    await installExtension();
});
