import { FormControlLabel, FormGroup, Switch } from '@mui/material';
import Stack from '@mui/material/Stack';
import React from 'react';
import { updatePlayerMetadata } from "../../types/metadata/PlayerMetadata";

import { PlayerMetadata } from '../../types/metadata/PlayerMetadata';
import { SceneMetadata, updateSceneMetadata } from '../../types/metadata/SceneMetadata';
import { ColorInput } from '../components/ColorInput';
import { OpacitySlider } from '../components/OpacitySlider';
import { SizeInput } from '../components/SizeInput';
import { StyleSelector } from '../components/StyleSelector';
import { useGrid, usePlayerMetadata, useSceneMetadata } from '../hooks';

interface ActionProps {
    initialPlayerMetadata: PlayerMetadata;
    initialSceneMetadata: SceneMetadata;
}

export function Action({ initialPlayerMetadata, initialSceneMetadata }: ActionProps) {
    const playerMetadata = usePlayerMetadata(initialPlayerMetadata);
    const sceneMetadata = useSceneMetadata(initialSceneMetadata);
    const grid = useGrid();
    if (!grid) {
        return <div>Loading...</div>;
    }

    return <>
        <h4>Defaults</h4>
        <Stack direction="row" gap={1} sx={{ mb: 2 }}>
            <StyleSelector fullWidth
                value={playerMetadata.styleType}
                onChange={styleType => updatePlayerMetadata({ styleType })}
            />
            <SizeInput
                grid={grid}
                value={playerMetadata.size}
                onChange={size => updatePlayerMetadata({ size })}
            />
        </Stack>
        <Stack direction="row" gap={1}>
            <ColorInput
                value={playerMetadata.color}
                onChange={color => updatePlayerMetadata({ color })}
            />
            <OpacitySlider sx={{ flexGrow: 1 }}
                value={playerMetadata.opacity}
                onChange={opacity => updatePlayerMetadata({ opacity })}
            />
        </Stack>
        <h4>Global Settings</h4>
        <FormGroup>
            <FormControlLabel
                control={
                    <Switch
                        checked={sceneMetadata.gridMode}
                        onChange={(_, gridMode) => updateSceneMetadata({ gridMode })} />}
                label="Shape to grid" />
        </FormGroup>
    </>;
}