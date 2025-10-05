import OBR from "@owlbear-rodeo/sdk";
import { deferCallAll, sceneReadyPromise } from "owlbear-utils";
import { usePlayerStorage } from "./usePlayerStorage";

/**
 * @returns [Promise that resolves once store has initialized, function to stop syncing]
 */
export function startSyncing(): [
    initialized: Promise<void>,
    unsubscribe: VoidFunction,
] {
    // console.log("startSyncing");
    const {
        handlePlayerChange,
        setSceneMetadata,
        setGrid,
        updateItems,
        setSceneReady,
        handleToolModeUpdate,
        handlePermissionsChange,
        handleThemeChange,
    } = usePlayerStorage.getState();

    const playerInitialized = Promise.all([
        OBR.player.getId(),
        OBR.player.getRole(),
        OBR.player.getSelection(),
    ]).then(([id, role, selection]) =>
        handlePlayerChange({ id, role, selection }),
    );
    const unsubscribePlayer = OBR.player.onChange(handlePlayerChange);

    const sceneReady = sceneReadyPromise();
    const sceneMetadataInitialized = sceneReady
        .then(() => OBR.scene.getMetadata())
        .then(setSceneMetadata);
    const unsubscribeSceneMetadata =
        OBR.scene.onMetadataChange(setSceneMetadata);

    const gridInitialized = sceneReady
        .then(() =>
            Promise.all([
                OBR.scene.grid.getDpi(),
                OBR.scene.grid.getMeasurement(),
                OBR.scene.grid.getType(),
            ]),
        )
        .then(([dpi, measurement, type]) =>
            setGrid({ dpi, measurement, type }),
        );
    const unsubscribeGrid = OBR.scene.grid.onChange(setGrid);

    const unsubscribeItems = OBR.scene.items.onChange((items) =>
        updateItems(items),
    );

    const sceneReadyInitialized = OBR.scene.isReady().then(setSceneReady);
    const unsubscribeSceneReady = OBR.scene.onReadyChange((ready) => {
        setSceneReady(ready);
    });

    const toolModeInitialized = sceneReady
        .then(() => OBR.tool.getActiveToolMode())
        .then(handleToolModeUpdate);
    const unsubscribeToolMode = OBR.tool.onToolModeChange(handleToolModeUpdate);

    const permissionsInitialized = OBR.room
        .getPermissions()
        .then(handlePermissionsChange);
    const unsubscribePermissions = OBR.room.onPermissionsChange(
        handlePermissionsChange,
    );

    const themeInitialized = OBR.theme.getTheme().then(handleThemeChange);
    const unsubscribeTheme = OBR.theme.onChange(handleThemeChange);

    return [
        Promise.all([
            playerInitialized,
            sceneMetadataInitialized,
            gridInitialized,
            sceneReadyInitialized,
            toolModeInitialized,
            permissionsInitialized,
            themeInitialized,
        ]).then(() => void 0),
        deferCallAll(
            unsubscribePlayer, // covers role and player metadata and selection
            unsubscribeSceneMetadata,
            unsubscribeGrid,
            unsubscribeItems,
            unsubscribeSceneReady,
            unsubscribeToolMode,
            unsubscribePermissions,
            unsubscribeTheme,
        ),
    ];
}
