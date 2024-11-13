/**
 * This file represents the HTML of the popover that is shown once
 * the auras context menu item is clicked.
 */

import CssBaseline from '@mui/material/CssBaseline';
import React from 'react';
import ReactDOM from 'react-dom/client';
import "../../../assets/style.css";
import { PluginGate } from '../PluginGate';
import { PluginThemeProvider } from '../PluginThemeProvider';
import { ContextMenu } from './ContextMenu';

ReactDOM.createRoot(document.getElementById('reactApp')!).render(
    <React.StrictMode>
        <PluginGate>
            <PluginThemeProvider>
                <CssBaseline />
                <ContextMenu />
            </PluginThemeProvider>
        </PluginGate>
    </React.StrictMode>
);