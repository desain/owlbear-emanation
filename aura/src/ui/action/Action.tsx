import { FormControlLabel, FormGroup, Switch } from '@mui/material';
import Stack from '@mui/material/Stack';
import React from 'react';
import { updatePlayerMetadata } from "../../types/metadata/PlayerMetadata";

import { updateSceneMetadata } from '../../types/metadata/SceneMetadata';
import { ColorInput } from '../components/ColorInput';
import { OpacitySlider } from '../components/OpacitySlider';
import { SizeInput } from '../components/SizeInput';
import { StyleSelector } from '../components/StyleSelector';
import { useGrid, usePlayerMetadata, useSceneMetadata } from '../hooks';

export function Action() {
    const playerMetadata = usePlayerMetadata();
    const sceneMetadata = useSceneMetadata();
    const grid = useGrid();

    if (grid === null || playerMetadata === null || sceneMetadata === null) {
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
                        onChange={(_, gridMode) => updateSceneMetadata({ gridMode })}
                    />}
                label="Shape to grid"
            />
        </FormGroup>
    </>;
}