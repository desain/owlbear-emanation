import OBR from "@owlbear-rodeo/sdk";
import { deferCallAll } from "owlbear-utils";
import { usePlayerStorage } from "./usePlayerStorage";

/**
 *
 * @param syncParams
 * @returns [Promise that resolves once store has initialized, function to stop syncing]
 */
export function startSyncing(): [Promise<void>, VoidFunction] {
    // console.log("startSyncing");
    const store = usePlayerStorage.getState();

    const roleInitialized = OBR.player.getRole().then(store.setRole);
    const playerIdInitialized = OBR.player.getId().then(store.setPlayerId);
    const selectionInitialized = OBR.player
        .getSelection()
        .then(store.setSelection);
    const unsubscribePlayer = OBR.player.onChange((player) => {
        store.setRole(player.role);
        store.setPlayerId(player.id);
        void store.setSelection(player.selection);
    });

    const sceneMetadataInitialized = OBR.scene
        .getMetadata()
        .then(store.setSceneMetadata);
    const unsubscribeSceneMetadata = OBR.scene.onMetadataChange(
        store.setSceneMetadata,
    );

    const gridInitialized = Promise.all([
        OBR.scene.grid.getDpi(),
        OBR.scene.grid.getMeasurement(),
        OBR.scene.grid.getType(),
    ]).then(([dpi, measurement, type]) =>
        store.setGrid({ dpi, measurement, type }),
    );
    const unsubscribeGrid = OBR.scene.grid.onChange(store.setGrid);

    const unsubscribeItems = OBR.scene.items.onChange((items) =>
        store.updateItems(items),
    );

    const sceneReadyInitialized = OBR.scene.isReady().then(store.setSceneReady);
    const unsubscribeSceneReady = OBR.scene.onReadyChange((ready) => {
        store.setSceneReady(ready);
    });

    return [
        Promise.all([
            roleInitialized,
            playerIdInitialized,
            selectionInitialized,
            sceneMetadataInitialized,
            gridInitialized,
            sceneReadyInitialized,
        ]).then(() => void 0),
        deferCallAll(
            unsubscribePlayer, // covers role and player metadata and selection
            unsubscribeSceneMetadata,
            unsubscribeGrid,
            unsubscribeItems,
            unsubscribeSceneReady,
        ),
    ];
}
