import OBR, { Item } from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import { watchGrid } from "../types/GridParsed";
import { watchPlayerMetadata } from "../types/metadata/PlayerMetadata";
import { watchSceneMetadata } from "../types/metadata/SceneMetadata";
import { Watcher } from "../utils/watchers";

// hooks for watching OBR state
// these are currently only used at one place in the component hierarchy, and data passed
// through props
// if UI gets complicated enough that they're needed in multiple places, zustand or react-query
// might be better

function makeWatcherHook<T>(watcher: Watcher<T>) {
    return function useWatcher() {
        const [value, setValue] = useState(null as T | null);
        useEffect(() => {
            const [, uninstall] = watcher(setValue);
            return uninstall;
        }, []);
        return value;
    };
}

export const useSceneMetadata = makeWatcherHook(watchSceneMetadata);

export const useGrid = makeWatcherHook(watchGrid);

export const usePlayerMetadata = makeWatcherHook(watchPlayerMetadata);

export function useSelection() {
    const [selection, setSelection] = useState([] as string[]);
    const [selectedItems, setSelectedItems] = useState([] as Item[]);

    useEffect(() => {
        void OBR.player.getSelection().then((selection) => {
            setSelection(selection ?? []);
        });
    }, []);

    useEffect(() => {
        void OBR.scene.items.getItems(selection).then(setSelectedItems);
        return OBR.scene.items.onChange((items) => {
            setSelectedItems(
                items.filter((item) => selection.includes(item.id)),
            );
        });
    }, [selection]);

    return selectedItems;
}
