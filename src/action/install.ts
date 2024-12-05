import OBR from "@owlbear-rodeo/sdk";

import { version } from "../../package.json";
import AuraFixer from "../AuraFixer";
import { MESSAGE_CHANNEL } from "../constants";
import createContextMenu from "../contextmenu/createContextMenu";
import { deferCallAll } from "../utils/jsUtils";
import { handleMessage } from "../utils/messaging";
/**
 * This file represents the background script run when the plugin loads.
 * It creates the context menu item for the aura.
 */

export default async function installAuras(): Promise<VoidFunction> {
    console.log(`Auras and Emanations version ${version}`);
    await createContextMenu();

    const uninstallers: VoidFunction[] = [];
    const [, uninstallFixer] = await AuraFixer.install();
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
