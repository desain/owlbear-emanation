import OBR from "@owlbear-rodeo/sdk";
import { deferCallAll } from "owlbear-utils";
import { usePlayerStorage } from "./usePlayerStorage";

/**
 * @returns [Promise that resolves once store has initialized, function to stop syncing]
 */
export function startSyncing(): [
    initialized: Promise<void>,
    unsubscribe: VoidFunction,
] {
    // console.log("startSyncing");
    const store = usePlayerStorage.getState();

    const playerInitialized = Promise.all([
        OBR.player.getId(),
        OBR.player.getRole(),
        OBR.player.getSelection(),
    ]).then(([id, role, selection]) =>
        store.handlePlayerChange({ id, role, selection }),
    );
    const unsubscribePlayer = OBR.player.onChange(store.handlePlayerChange);

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

    const toolModeInitialized = sceneReadyInitialized
        .then(() => OBR.tool.getActiveToolMode())
        .then(store.handleToolModeUpdate);
    const unsubscribeToolMode = OBR.tool.onToolModeChange(
        store.handleToolModeUpdate,
    );

    return [
        Promise.all([
            playerInitialized,
            sceneMetadataInitialized,
            gridInitialized,
            sceneReadyInitialized,
            toolModeInitialized,
        ]).then(() => void 0),
        deferCallAll(
            unsubscribePlayer, // covers role and player metadata and selection
            unsubscribeSceneMetadata,
            unsubscribeGrid,
            unsubscribeItems,
            unsubscribeSceneReady,
            unsubscribeToolMode,
        ),
    ];
}
