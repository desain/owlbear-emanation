import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import { useOwlbearStore } from "./useOwlbearStore";
import { deferCallAll } from "./utils/jsUtils";

interface SyncParams {
    syncItems: boolean;
}

// store should be accessible from background
export function startSyncing(
    syncParams: SyncParams,
): [Promise<void>, VoidFunction] {
    const store = useOwlbearStore.getState();

    const roleInitialized = OBR.player.getRole().then(store.setRole);
    const selectionInitialized = OBR.player
        .getSelection()
        .then(store.setSelection);
    const unsubscribePlayer = OBR.player.onChange((player) => {
        store.setRole(player.role);
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

    const unsubscribeItems = syncParams.syncItems
        ? OBR.scene.items.onChange((items) => store.updateItems(items))
        : () => {};

    return [
        Promise.all([
            roleInitialized,
            selectionInitialized,
            sceneMetadataInitialized,
            gridInitialized,
        ]).then(() => void 0),
        deferCallAll(
            unsubscribePlayer, // covers role and player metadata and selection
            unsubscribeSceneMetadata,
            unsubscribeGrid,
            unsubscribeItems,
        ),
    ];
}

export function useOwlbearStoreSync(syncParams: SyncParams) {
    const [initialized, setInitialized] = useState(false);
    useEffect(() => {
        const [initializedPromise, unsubscribe] = startSyncing(syncParams);
        void initializedPromise.then(() => setInitialized(true));
        return unsubscribe;
    }, [syncParams]);
    return initialized;
}
