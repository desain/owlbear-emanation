import OBR from "@owlbear-rodeo/sdk";

import AwaitLock from "await-lock";
import { MESSAGE_CHANNEL, METADATA_KEY } from "./constants";
import createContextMenu from "./createContextMenu";
import { isAura } from './types/Aura';
import { getSceneMetadata, SceneMetadata, sceneMetadataChanged, updateSceneMetadata } from "./types/metadata/SceneMetadata";
import LocalItemFixer from './utils/LocalItemFixer';
import { handleScaleChanges } from "./utils/handleScaleChanges";
import { getId } from "./utils/itemUtils";
import { handleMessage } from "./utils/messaging";
/**
* This file represents the background script run when the plugin loads.
* It creates the context menu item for the aura.
*/

export default async function installAuras() {
    console.log("Auras and Emanations version 0.1.0");
    createContextMenu();

    const uninstallers: VoidFunction[] = [];
    const auraReplaceLock = new AwaitLock();
    const [fixer, uninstallFixer] = LocalItemFixer.install();
    uninstallers.push(uninstallFixer);
    uninstallers.push(installBroadcastListener());
    // Only install global listeners that can change network items for one instance
    const isGm = await OBR.player.getRole() === 'GM';
    uninstallers.push(installItemHandler(auraReplaceLock, fixer, isGm));
    uninstallers.push(installSceneMetadataWatcher(auraReplaceLock, fixer));

    if (isGm) {
        uninstallers.push(installGridHandler());
        await updateSceneMetadata(await getSceneMetadata());
    }
    await fixer.fix();


    return () => uninstallers.forEach(uninstaller => uninstaller());
}



function installItemHandler(auraReplaceLock: AwaitLock, fixer: LocalItemFixer, isGm: boolean) {
    return OBR.scene.items.onChange(async () => {
        await auraReplaceLock.acquireAsync();
        try {
            if (isGm) {
                await handleScaleChanges();
            }

            await fixer.fix();
        } finally {
            auraReplaceLock.release();
        }
    });
}

function installSceneMetadataWatcher(auraReplaceLock: AwaitLock, fixer: LocalItemFixer) {
    let oldMetadata: SceneMetadata | null = null;
    return OBR.scene.onMetadataChange(async (metadata) => {
        await auraReplaceLock.acquireAsync();
        try {
            const newMetadata = metadata[METADATA_KEY] as SceneMetadata | undefined;
            if (newMetadata !== undefined && (oldMetadata === null || sceneMetadataChanged(newMetadata, oldMetadata))) {
                // clear out local auras so they can be recreated
                const localItems = await OBR.scene.local.getItems();
                const toDelete = localItems.filter(isAura).map(getId);
                await OBR.scene.local.deleteItems(toDelete);
                await fixer.fix()
                oldMetadata = newMetadata;
            }
        } finally {
            auraReplaceLock.release();
        }
    });
}

function installGridHandler() {
    return OBR.scene.grid.onChange(async (grid) => {
        const newSceneMetadata: Partial<SceneMetadata> = {
            gridDpi: grid.dpi,
            gridMultiplier: (await OBR.scene.grid.getScale()).parsed.multiplier,
            gridMeasurement: grid.measurement,
            gridType: grid.type,
        };

        return await updateSceneMetadata(newSceneMetadata);
    });
}

function installBroadcastListener() {
    console.log("Installing broadcast listener");
    return OBR.broadcast.onMessage(MESSAGE_CHANNEL, ({ data }) => {
        return handleMessage(data);
    });
}