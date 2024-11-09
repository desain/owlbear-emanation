import OBR, { Math2 } from "@owlbear-rodeo/sdk";

import AwaitLock from "await-lock";
import { METADATA_KEY, VECTOR2_COMPARE_EPSILON } from "./constants";
import createContextMenu from "./createContextMenu";
import { Aura, isAura } from './types/Aura';
import { isSource } from './types/Source';
import { getSceneMetadata, SceneMetadata, sceneMetadataChanged, updateSceneMetadata } from "./types/metadata/SceneMetadata";
import LocalItemFixer from './utils/LocalItemFixer';
import { assertItem, getId } from "./utils/itemUtils";

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
    uninstallers.push(installSceneMetadataWatcher(auraReplaceLock, fixer));

    if (isGm) {
        uninstallers.push(installGridHandler());
        await updateSceneMetadata(await getSceneMetadata());
    }
    await fixer.fix();


    return () => uninstallers.forEach(uninstaller => uninstaller());
}

async function handleSizeChanges() {
    // We want to rebuild auras whose source item changed sizes
    const changedSize = (await OBR.scene.items.getItems())
        .filter(source => isSource(source)
            && !Math2.compare(source.scale, source.metadata[METADATA_KEY].scale, VECTOR2_COMPARE_EPSILON))
        .map(getId);

    // Note the new size
    await OBR.scene.items.updateItems(changedSize, (items) => items.forEach((source) => {
        assertItem(source, isSource);
        source.metadata[METADATA_KEY].scale = source.scale;
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

        await updateSceneMetadata(newSceneMetadata);
    });
}