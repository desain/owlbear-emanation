import OBR from "@owlbear-rodeo/sdk";

import AwaitLock from "await-lock";
import { MESSAGE_CHANNEL, METADATA_KEY } from "./constants";
import createContextMenu from "./createContextMenu";
import { isAura } from './types/Aura';
import { SceneMetadata, sceneMetadataChanged } from "./types/metadata/SceneMetadata";
import { createGridWatcher, GridParsed } from './ui/GridParsed';
import LocalItemFixer from './utils/LocalItemFixer';
import { handleScaleChanges } from "./utils/handleScaleChanges";
import { getId } from './utils/itemUtils';
import { handleMessage } from "./utils/messaging";
/**
* This file represents the background script run when the plugin loads.
* It creates the context menu item for the aura.
*/

export default async function installAuras() {
    console.log("Auras and Emanations version 0.1.0");
    await createContextMenu();


    const uninstallers: VoidFunction[] = [];
    const auraReplaceLock = new AwaitLock();
    const [fixer, uninstallFixer] = LocalItemFixer.install();


    const [getGrid, unsubscribeGrid] = await createGridWatcher(async grid => {
        console.log("Grid changed", grid);
        await auraReplaceLock.acquireAsync();
        try {
            await rebuildAuras(fixer, grid);
        } finally {
            auraReplaceLock.release();
        }
    });
    uninstallers.push(unsubscribeGrid);

    uninstallers.push(uninstallFixer);
    uninstallers.push(installBroadcastListener());
    // Only install global listeners that can change network items for one instance
    const isGm = await OBR.player.getRole() === 'GM';
    uninstallers.push(installItemHandler(auraReplaceLock, fixer, isGm, getGrid));
    uninstallers.push(installSceneMetadataWatcher(auraReplaceLock, fixer, getGrid));

    // if (isGm) {
    //     await updateSceneMetadata(await getSceneMetadata());
    // }
    await fixer.fix(getGrid());
    return () => uninstallers.forEach(uninstaller => uninstaller());
}

async function rebuildAuras(fixer: LocalItemFixer, grid: GridParsed) {
    // clear out local auras so they can be recreated
    const localItems = await OBR.scene.local.getItems();
    const toDelete = localItems.filter(isAura).map(getId);
    await OBR.scene.local.deleteItems(toDelete);
    await fixer.fix(grid)
}

function installItemHandler(auraReplaceLock: AwaitLock, fixer: LocalItemFixer, isGm: boolean, getGrid: () => GridParsed) {
    return OBR.scene.items.onChange(async () => {
        await auraReplaceLock.acquireAsync();
        try {
            if (isGm) {
                await handleScaleChanges();
            }

            await fixer.fix(getGrid());
        } finally {
            auraReplaceLock.release();
        }
    });
}

function installSceneMetadataWatcher(auraReplaceLock: AwaitLock, fixer: LocalItemFixer, getGrid: () => GridParsed) {
    let oldMetadata: SceneMetadata | null = null;
    return OBR.scene.onMetadataChange(async metadata => {
        await auraReplaceLock.acquireAsync();
        try {
            const newMetadata = metadata[METADATA_KEY] as SceneMetadata | undefined;
            if (newMetadata !== undefined && (oldMetadata === null || sceneMetadataChanged(newMetadata, oldMetadata))) {
                await rebuildAuras(fixer, getGrid());
                oldMetadata = newMetadata;
            }
        } finally {
            auraReplaceLock.release();
        }
    });
}

function installBroadcastListener() {
    return OBR.broadcast.onMessage(MESSAGE_CHANNEL, ({ data }) => {
        return handleMessage(data);
    });
}