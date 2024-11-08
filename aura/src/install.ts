import OBR, { Math2 } from "@owlbear-rodeo/sdk";

import AwaitLock from "await-lock";
import { METADATA_KEY, VECTOR2_COMPARE_EPSILON } from "./constants";
import createContextMenu from "./createContextMenu";
import { getSceneMetadata, SceneMetadata, sceneMetadataChanged, updateSceneMetadata } from "./metadata/SceneMetadata";
import { Aura, isAura } from './types/Aura';
import { isSource } from './types/Source';
import LocalItemFixer from './utils/LocalItemFixer';
import { getId } from "./utils/itemUtils";

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
    // Only install global listeners that can change network items for one instance
    const isGm = await OBR.player.getRole() === 'GM';
    uninstallers.push(installItemHandler(auraReplaceLock, fixer, isGm));
    uninstallers.push(installGridHandler(auraReplaceLock, fixer, isGm));

    await fixer.fix();
    if (isGm) {
        await updateSceneMetadata(await getSceneMetadata());
    }
    return () => {
        console.log('uninstalling plugin');
        uninstallers.forEach((uninstaller) => uninstaller());
    }
}

async function handleSizeChanges() {
    // We want to rebuild auras whose source item changed sizes
    const changedSize = (await OBR.scene.items.getItems())
        .filter(source => isSource(source)
            && !Math2.compare(source.scale, source.metadata[METADATA_KEY].scale, VECTOR2_COMPARE_EPSILON))
        .map(getId);

    // Note the new size
    await OBR.scene.items.updateItems(changedSize, (items) => items.forEach((source) => {
        if (isSource(source)) {
            source.metadata[METADATA_KEY].scale = source.scale;
        }
    }));

    // Update the network items
    const isAttachedToSizeChanger = (aura: Aura) => changedSize.includes(aura.attachedTo);
    const changingLocalAuras = (await OBR.scene.local.getItems())
        .filter(isAura)
        .filter(isAttachedToSizeChanger)
        .map(getId);
    await OBR.scene.local.deleteItems(changingLocalAuras); // fix is called after this function so they'll come back rebuilt
}

function installItemHandler(auraReplaceLock: AwaitLock, fixer: LocalItemFixer, isGm: boolean) {
    return OBR.scene.items.onChange(async () => {
        await auraReplaceLock.acquireAsync();
        try {
            if (isGm) {
                await handleSizeChanges();
            }

            await fixer.fix();
        } finally {
            auraReplaceLock.release();
        }
    });
}

function installGridHandler(auraReplaceLock: AwaitLock, fixer: LocalItemFixer, isGm: boolean) {
    return OBR.scene.grid.onChange(async (grid) => {
        await auraReplaceLock.acquireAsync();
        try {
            const sceneMetadata = await getSceneMetadata();
            const newSceneMetadata: Partial<SceneMetadata> = {
                gridDpi: grid.dpi,
                gridMultiplier: (await OBR.scene.grid.getScale()).parsed.multiplier,
                gridMeasurement: grid.measurement,
                gridType: grid.type,
            };

            if (sceneMetadataChanged(newSceneMetadata, sceneMetadata)) {
                // one player's instance of this extension updates global values
                if (isGm) {
                    await updateSceneMetadata(newSceneMetadata);
                }

                // clear out local auras so they can be recreated
                const localItems = await OBR.scene.local.getItems();
                const toDelete = localItems.filter(isAura).map(getId);
                await OBR.scene.local.deleteItems(toDelete);
                await fixer.fix()
            }
        } finally {
            auraReplaceLock.release();
        }
    });
}