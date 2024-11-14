import OBR from "@owlbear-rodeo/sdk";

import { MESSAGE_CHANNEL } from "../constants";
import { deferCallAll } from "../utils/jsUtils";
import LocalItemFixer from "../utils/LocalItemFixer";
import { handleMessage } from "../utils/messaging";
import createContextMenu from "./createContextMenu";
/**
 * This file represents the background script run when the plugin loads.
 * It creates the context menu item for the aura.
 */

let fixerRefForHotReload: LocalItemFixer | null = null;
export default async function installAuras() {
    console.log("Auras and Emanations version 1.0.0");
    await createContextMenu();

    const uninstallers: VoidFunction[] = [];
    const [fixer, uninstallFixer] = await LocalItemFixer.install();
    fixerRefForHotReload = fixer;
    uninstallers.push(uninstallFixer);
    uninstallers.push(installBroadcastListener());

    return deferCallAll(
        () => console.log("Uninstalling Auras and Emanations"),
        ...uninstallers,
    );
}

function installBroadcastListener() {
    return OBR.broadcast.onMessage(MESSAGE_CHANNEL, ({ data }) => {
        return handleMessage(data);
    });
}

if (import.meta.hot) {
    import.meta.hot.accept();
    import.meta.hot.dispose(() => {
        void fixerRefForHotReload?.destroy();
    });
}
