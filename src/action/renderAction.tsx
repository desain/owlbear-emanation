import CssBaseline from "@mui/material/CssBaseline";
import OBR from "@owlbear-rodeo/sdk";
import React from "react";
import ReactDOM from "react-dom/client";
import "../../assets/style.css";
import { PluginGate } from "../ui/PluginGate";
import { PluginThemeProvider } from "../ui/PluginThemeProvider";
import { Action } from "./Action";
import installAuras from "./install";

let uninstall: VoidFunction = () => {};
let root: ReactDOM.Root | null = null;

if (import.meta.hot) {
    import.meta.hot.accept();
    import.meta.hot.dispose(() => {
        console.log("Disposing");
        uninstall();
        root?.unmount();
        root = null;
    });
}

OBR.onReady(async () => {
    // console.log("onReady");

    if (await OBR.scene.isReady()) {
        // console.log("isReady");
        uninstall = await installAuras();
    }

    OBR.scene.onReadyChange(async (ready) => {
        // console.log("onReadyChange", ready);
        if (ready) {
            uninstall = await installAuras();
        } else {
            uninstall();
            uninstall = () => {};
        }
    });

    root = ReactDOM.createRoot(document.getElementById("reactApp")!);
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
