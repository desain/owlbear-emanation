import OBR from "@owlbear-rodeo/sdk";

import AwaitLock from "await-lock";
import { MESSAGE_CHANNEL, METADATA_KEY } from "./constants";
import createContextMenu from "./createContextMenu";
import { isAura } from './types/Aura';
import { SceneMetadata, sceneMetadataChanged } from "./types/metadata/SceneMetadata";
import { createGridWatcher, GridParsed } from './ui/GridParsed';
import LocalItemFixer from './utils/LocalItemFixer';
import { ScaleTracker } from "./utils/ScaleTracker";
import { getId } from './utils/itemUtils';
import { handleMessage } from "./utils/messaging";
/**
* This file represents the background script run when the plugin loads.
* It creates the context menu item for the aura.
*/

function createLock() {
    const lock = new AwaitLock();
    return async (runnable: () => Promise<void>) => {
        await lock.acquireAsync();
        try {
            await runnable();
        } finally {
            lock.release();
        }
    }
}

export default async function installAuras() {
    console.log("Auras and Emanations version 0.1.0");
    await createContextMenu();

    const uninstallers: VoidFunction[] = [];

    const withLock = createLock();

    const [fixer, uninstallFixer] = LocalItemFixer.install();
    uninstallers.push(uninstallFixer);

    const [getGrid, unsubscribeGrid] = await createGridWatcher(async grid => {
        return await withLock(async () => {
            await rebuildAuras(fixer, grid);
        })
    });
    uninstallers.push(unsubscribeGrid);

    uninstallers.push(installBroadcastListener());

    const tracker = new ScaleTracker();
    uninstallers.push(OBR.scene.items.onChange(async items => {
        return await withLock(async () => {
            const toDelete = await tracker.getNeedsRebuild(items);
            await rebuildAuras(fixer, getGrid(), toDelete);
        });
    }));

    uninstallers.push(installSceneMetadataWatcher(withLock, fixer, getGrid));

    await fixer.fix(getGrid());
    return () => {
        console.log('Uninstalling Auras and Emanations');
        uninstallers.forEach(uninstaller => uninstaller());
    };
}

async function rebuildAuras(fixer: LocalItemFixer, grid: GridParsed, ids?: string[]) {
    // clear out local auras so they can be recreated
    if (ids === undefined) {
        const localItems = await OBR.scene.local.getItems();
        ids = localItems.filter(isAura).map(getId);
    }
    await OBR.scene.local.deleteItems(ids);
    await fixer.fix(grid)
}

function installSceneMetadataWatcher(withLock: (runnable: () => Promise<void>) => Promise<void>, fixer: LocalItemFixer, getGrid: () => GridParsed) {
    let oldMetadata: SceneMetadata | null = null;
    return OBR.scene.onMetadataChange(async metadata => {
        return await withLock(async () => {
            const newMetadata = metadata[METADATA_KEY] as SceneMetadata | undefined;
            if (newMetadata !== undefined && (oldMetadata === null || sceneMetadataChanged(newMetadata, oldMetadata))) {
                await rebuildAuras(fixer, getGrid());
                oldMetadata = newMetadata;
            }
        });
    });
}

function installBroadcastListener() {
    return OBR.broadcast.onMessage(MESSAGE_CHANNEL, ({ data }) => {
        return handleMessage(data);
    });
}