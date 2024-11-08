import OBR from "@owlbear-rodeo/sdk";
import * as mdc from 'material-components-web';
import 'material-components-web/dist/material-components-web.min.css';
import ready from "../../../ready";
import "../../assets/style.css";
import installTheme from "../installTheme";
import { getPlayerMetadata, updatePlayerMetadata } from "../metadata/PlayerMetadata";
import { getSceneMetadata, updateSceneMetadata } from "../metadata/SceneMetadata";
import { createColorInput, installColorChangeHandler } from "./elements/colorInput";
import { createControlRow } from './elements/controlRow';
import { createGridModeCheckbox, installGridModeChangeHandler } from './elements/gridModeCheckbox';
import { createOpacityInput, installOpacityChangeHandler } from "./elements/opacityInput";
import { createSizeInput, installSizeChangeHandler } from "./elements/sizeInput";
import { createStyleSelect, installStyleChangeHandler } from './elements/styleSelect';

ready(renderAction);

async function renderAction() {
    const app = document.getElementById('app')!!;

    const [
        sceneAuraMetadata,
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
        ${createControlRow(createStyleSelect(null, playerMetadata.styleType), createSizeInput(null, playerMetadata.size, scale))}
        ${createControlRow(createColorInput(null, playerMetadata.color), createOpacityInput(null, playerMetadata.opacity))}
        <h4>Global Settings</h4>
        ${createGridModeCheckbox(role, sceneAuraMetadata.gridMode)}
    `;

    installGridModeChangeHandler(async (gridMode) => updateSceneMetadata({ gridMode }));
    installOpacityChangeHandler((opacity) => updatePlayerMetadata({ opacity }));
    installColorChangeHandler((color) => updatePlayerMetadata({ color }));
    installSizeChangeHandler((size) => updatePlayerMetadata({ size }));
    installStyleChangeHandler((styleType) => updatePlayerMetadata({ styleType }));

    mdc.autoInit();

    return uninstallThemeHandler;
}