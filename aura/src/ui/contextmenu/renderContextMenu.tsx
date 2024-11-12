/**
 * This file represents the HTML of the popover that is shown once
 * the auras context menu item is clicked.
 */

import CssBaseline from '@mui/material/CssBaseline';
import OBR from "@owlbear-rodeo/sdk";
import React from 'react';
import ReactDOM from 'react-dom/client';
import "../../../assets/style.css";
import { getPlayerMetadata } from '../../types/metadata/PlayerMetadata';
import { PluginGate } from '../PluginGate';
import { PluginThemeProvider } from '../PluginThemeProvider';
import { ContextMenu } from './ContextMenu';

async function renderContextMenu() {
    const [
        selection,
        playerMetadata
    ] = await Promise.all([
        OBR.player.getSelection(),
        getPlayerMetadata(),
    ]);

    ReactDOM.createRoot(document.getElementById('reactApp')!).render(
        <React.StrictMode>
            <PluginGate>
                <PluginThemeProvider>
                    <CssBaseline />
                    <ContextMenu
                        initialPlayerMetadata={playerMetadata}
                        selection={selection ?? []}
                    />
                </PluginThemeProvider>
            </PluginGate>
        </React.StrictMode>
    );
}

OBR.onReady(renderContextMenu);