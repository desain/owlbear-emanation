import OBR, { Item } from '@owlbear-rodeo/sdk';
import React, { useEffect, useState } from 'react';
import { PlayerMetadata, getPlayerMetadata } from '../types/metadata/PlayerMetadata';
import { SceneMetadata, getSceneMetadata } from '../types/metadata/SceneMetadata';
import { GridParsed } from './GridParsed';

export function usePlayerMetadata() {
    const [playerMetadata, setPlayerMetadataHookState] = useState(null as PlayerMetadata | null);

    useEffect(() => {
        void OBR.player.getMetadata().then(async metadata => {
            setPlayerMetadataHookState(await getPlayerMetadata(metadata));
        })
        return OBR.player.onChange(async player => setPlayerMetadataHookState(await getPlayerMetadata(player.metadata)));
    }, []);

    return playerMetadata;
}

export function useSceneMetadata() {
    const [sceneMetadata, setSceneMetadata] = useState(null as SceneMetadata | null);

    useEffect(() => {
        void OBR.scene.getMetadata().then(async metadata => {
            setSceneMetadata(await getSceneMetadata(metadata));
        })
        return OBR.scene.onMetadataChange(async metadata => setSceneMetadata(await getSceneMetadata(metadata)));
    }, []);

    return sceneMetadata;
}

export function useGrid() {
    const [grid, setGrid] = React.useState(null as GridParsed | null);

    useEffect(() => {
        async function fetchGrid() {
            const [
                dpi,
                fullScale,
                measurement,
                type,
            ] = await Promise.all([
                OBR.scene.grid.getDpi(),
                OBR.scene.grid.getScale(),
                OBR.scene.grid.getMeasurement(),
                OBR.scene.grid.getType(),
            ]);
            setGrid({
                dpi,
                measurement,
                parsedScale: fullScale.parsed,
                type,
            });
        }

        const unsubscribeGrid = OBR.scene.grid.onChange(async grid => {
            const fullScale = await OBR.scene.grid.getScale();
            setGrid({
                ...grid,
                parsedScale: fullScale.parsed,
            });
        });

        if (grid === null) {
            void fetchGrid();
        }

        return unsubscribeGrid;
    }, [grid])

    return grid;
}

export function useSelection() {
    const [selection, setSelection] = useState([] as string[]);
    const [selectedItems, setSelectedItems] = useState([] as Item[]);

    useEffect(() => {
        void OBR.player.getSelection().then(selection => {
            setSelection(selection ?? []);
        });;
    }, []);

    useEffect(() => {
        void OBR.scene.items.getItems(selection).then(setSelectedItems);
        return OBR.scene.items.onChange(items => {
            setSelectedItems(items.filter(item => selection.includes(item.id)));
        });
    }, [selection]);

    return selectedItems;
}