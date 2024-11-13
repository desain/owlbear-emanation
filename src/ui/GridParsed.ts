import OBR, { Grid, GridScale } from '@owlbear-rodeo/sdk';
import { isDeepEqual } from '../utils/jsUtils';

export interface GridParsed extends Pick<Grid, 'dpi' | 'type' | 'measurement'> {
    parsedScale: GridScale['parsed'];
}

export function watchGrid(oldGrid: GridParsed | null, onGridChange: (grid: GridParsed) => void): [Promise<GridParsed>, VoidFunction] {
    let gridParsed: GridParsed | null = oldGrid;
    let enabled = true;

    const updateGrid = (newGrid: GridParsed) => {
        const changed = gridParsed === null || !isDeepEqual(gridParsed, newGrid);
        gridParsed = newGrid;
        if (changed) {
            onGridChange(newGrid);
        }
    };

    // If we don't already have a grid, fire off an async routine to get it
    const firstGridPromise = (gridParsed !== null)
        ? Promise.resolve(gridParsed)
        : (async () => {
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
            const newGrid = {
                dpi,
                parsedScale: fullScale.parsed,
                measurement,
                type,
            };
            if (enabled) {
                updateGrid(newGrid);
            }
            return newGrid;
        })();

    const unsubscribeGrid = OBR.scene.grid.onChange(async grid => {
        const fullScale = await OBR.scene.grid.getScale();
        updateGrid({
            ...grid,
            parsedScale: fullScale.parsed,
        });
    });

    const stopWatching = () => {
        enabled = false;
        unsubscribeGrid();
    };
    return [firstGridPromise, stopWatching];
}

export async function createGridWatcher(onGridChange: (grid: GridParsed) => void): Promise<[() => GridParsed, VoidFunction]> {
    let grid: GridParsed;
    const [gridPromise, unsubscribeGrid] = watchGrid(null, newGrid => {
        grid = newGrid;
        onGridChange(grid);
    });
    grid = await gridPromise;
    return [() => grid, unsubscribeGrid];
}