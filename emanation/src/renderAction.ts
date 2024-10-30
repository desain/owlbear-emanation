import OBR from "@owlbear-rodeo/sdk";
import * as mdc from 'material-components-web';
import 'material-components-web/dist/material-components-web.min.css';
import ready from "../../ready";
import "../assets/style.css";
import installTheme from "./installTheme";
import { getPlayerMetadata, updatePlayerMetadata } from "./metadata/PlayerMetadata";
import { getSceneMetadata, updateSceneMetadata } from "./metadata/SceneMetadata";
import { createColorInput, installColorChangeHandler } from "./ui/colorInput";
import { createControlRow } from './ui/controlRow';
import { createGridModeCheckbox, installGridModeChangeHandler } from './ui/gridModeCheckbox';
import { createOpacityInput, installOpacityChangeHandler } from "./ui/opacityInput";
import { createSizeInput, installSizeChangeHandler } from "./ui/sizeInput";

ready(renderAction);

async function renderAction() {
    const app = document.getElementById('app')!!;

    const [
        sceneEmanationMetadata,
        playerMetadata,
        uninstallThemeHandler,
        role,
        scale,
    ] = await Promise.all([
        getSceneMetadata(),
        getPlayerMetadata(),
        installTheme(app, true),
        OBR.player.getRole(),
        OBR.scene.grid.getScale(),
    ]);

    app.innerHTML = `
        <h4>Defaults</h4>
        ${createControlRow(createColorInput(null, playerMetadata.color), createSizeInput(null, playerMetadata.size, scale))}
        ${createOpacityInput(null, playerMetadata.opacity)}
        <h4>Global Settings</h4>
        ${createGridModeCheckbox(role, sceneEmanationMetadata.gridMode)}
    `;

    installGridModeChangeHandler((gridMode) => updateSceneMetadata({ gridMode }));
    installOpacityChangeHandler((opacity) => updatePlayerMetadata({ opacity }));
    installColorChangeHandler((color) => updatePlayerMetadata({ color }));
    installSizeChangeHandler((size) => updatePlayerMetadata({ size }));

    mdc.autoInit();

    return uninstallThemeHandler;
}