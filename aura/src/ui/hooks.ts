import OBR, { Item } from '@owlbear-rodeo/sdk';
import React, { useEffect, useState } from 'react';
import { PlayerMetadata, getPlayerMetadata } from '../types/metadata/PlayerMetadata';
import { SceneMetadata, getSceneMetadata } from '../types/metadata/SceneMetadata';
import { GridParsed } from './GridParsed';

export function usePlayerMetadata(initialPlayerMetadata: PlayerMetadata) {
    const [playerMetadata, setPlayerMetadata] = useState(initialPlayerMetadata);

    useEffect(() => {
        return OBR.player.onChange(async () => setPlayerMetadata(await getPlayerMetadata()));
    }, []);

    return playerMetadata;
}

export function useSceneMetadata(initialSceneMetadata: SceneMetadata) {
    const [sceneMetadata, setSceneMetadata] = useState(initialSceneMetadata);

    useEffect(() => {
        return OBR.scene.onMetadataChange(async () => setSceneMetadata(await getSceneMetadata()));
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
            fetchGrid();
        }

        return unsubscribeGrid;
    }, [])

    return grid;
}

export function useSelection(selection: string[]) {
    const [selectedItems, setSelectedItems] = useState([] as Item[]);

    useEffect(() => {
        async function getInitialSelection() {
            const items = await OBR.scene.items.getItems(selection);
            setSelectedItems(items);
        }

        getInitialSelection();

        return OBR.scene.items.onChange(items => setSelectedItems(items.filter(item => selection.includes(item.id))))
    }, [selection]);

    return selectedItems;
}