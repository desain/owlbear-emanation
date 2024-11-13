import CssBaseline from "@mui/material/CssBaseline";
import React from 'react';
import ReactDOM from 'react-dom/client';
import "../../../assets/style.css";
import { PluginGate } from '../PluginGate';
import { PluginThemeProvider } from '../PluginThemeProvider';
import { Action } from './Action';

ReactDOM.createRoot(document.getElementById('reactApp')!).render(
    <React.StrictMode>
        <PluginGate>
            <PluginThemeProvider>
                <CssBaseline />
                <Action />
            </PluginThemeProvider>
        </PluginGate>
    </React.StrictMode>
);