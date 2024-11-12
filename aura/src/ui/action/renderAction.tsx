import CssBaseline from "@mui/material/CssBaseline";
import OBR from "@owlbear-rodeo/sdk";
import React from 'react';
import ReactDOM from 'react-dom/client';
import "../../../assets/style.css";
import { getPlayerMetadata } from "../../types/metadata/PlayerMetadata";
import { getSceneMetadata } from "../../types/metadata/SceneMetadata";
import { PluginGate } from '../PluginGate';
import { PluginThemeProvider } from '../PluginThemeProvider';
import { Action } from './Action';

async function renderAction() {
    const [
        sceneMetadata,
        playerMetadata,
    ] = await Promise.all([
        getSceneMetadata(),
        getPlayerMetadata(),
    ]);

    ReactDOM.createRoot(document.getElementById('reactApp')!).render(
        <React.StrictMode>
            <PluginGate>
                <PluginThemeProvider>
                    <CssBaseline />
                    <Action
                        initialPlayerMetadata={playerMetadata}
                        initialSceneMetadata={sceneMetadata}
                    />
                </PluginThemeProvider>
            </PluginGate>
        </React.StrictMode>
    );
}

OBR.onReady(renderAction);