import CssBaseline from "@mui/material/CssBaseline";
import OBR from "@owlbear-rodeo/sdk";
import { deferCallAll, PluginGate, PluginThemeProvider } from "owlbear-utils";
import React from "react";
import ReactDOM from "react-dom/client";
import "../../assets/style.css";
import { version } from "../../package.json";
import AuraFixer from "../AuraFixer";
import { CHANNEL_MESSAGE } from "../constants";
import { startSyncing } from "../state/startSyncing";
import { handleMessage } from "../utils/messaging";
import { Action } from "./Action";
import { startWatchingContextMenuEnabled } from "./createContextMenu";

let uninstall: VoidFunction = () => {
    // nothing to uninstall yet
};

function installBroadcastListener() {
    return OBR.broadcast.onMessage(CHANNEL_MESSAGE, ({ data }) =>
        handleMessage(data),
    );
}

async function installExtension(): Promise<VoidFunction> {
    console.log(`Auras and Emanations version ${version}`);

    const stopWatchingContextMenu = await startWatchingContextMenuEnabled();
    const [storeInitialized, stopSyncing] = startSyncing();
    await storeInitialized;
    const [, uninstallFixer] = await AuraFixer.install();
    const uninstallBroadcastListener = installBroadcastListener();

    return deferCallAll(
        () => console.log("Uninstalling Auras and Emanations"),
        stopSyncing,
        stopWatchingContextMenu,
        uninstallFixer,
        uninstallBroadcastListener,
    );
}

document.addEventListener("DOMContentLoaded", () => {
    const root = ReactDOM.createRoot(document.getElementById("reactApp")!);
    root.render(
        <React.StrictMode>
            <PluginGate>
                <PluginThemeProvider>
                    <CssBaseline />
                    <Action />
                </PluginThemeProvider>
            </PluginGate>
        </React.StrictMode>,
    );
});

OBR.onReady(async () => {
    // console.log("onReady");

    if (await OBR.scene.isReady()) {
        // console.log("isReady");
        uninstall = await installExtension();
    }

    OBR.scene.onReadyChange(async (ready) => {
        // console.log("onReadyChange", ready);
        if (ready) {
            uninstall = await installExtension();
        } else {
            uninstall();
            uninstall = () => {
                // nothing to uninstall anymore
            };
        }
    });
});
