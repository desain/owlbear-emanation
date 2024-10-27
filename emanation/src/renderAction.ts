import OBR from "@owlbear-rodeo/sdk";
import ready from "../../ready";
import "../assets/style.css";
import installTheme from "./installTheme";
import { getPlayerMetadata, updatePlayerMetadata } from "./metadata/PlayerMetadata";
import { getSceneMetadata, updateSceneMetadata } from "./metadata/SceneMetadata";
import { createColorInput, installColorChangeHandler } from "./ui/colorInput";
import { createControlRow } from './ui/controlRow';
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

    const globalSettings = role === 'GM' ? `
        <h4>Global Settings</h4>
        <label for="grid-mode">Grid Mode</label>
        <input
            type="checkbox"
            id="grid-mode"
            name="grid-mode"
            ${sceneEmanationMetadata.gridMode ? 'checked' : ''} />
    ` : '';

    app.innerHTML = `
        <h4>Defaults</h4>
        ${createControlRow(createColorInput(null, playerMetadata.color), createSizeInput(null, playerMetadata.size, scale))}
        ${createOpacityInput(null, playerMetadata.opacity)}
        ${globalSettings}
    `;

    const gridModeCheckbox = <HTMLInputElement | null>document.getElementById('grid-mode');
    gridModeCheckbox?.addEventListener('change', async () => {
        const gridMode = gridModeCheckbox.checked;
        await updateSceneMetadata({ gridMode });
    });

    installOpacityChangeHandler((opacity) =>
        updatePlayerMetadata({ opacity })
    )

    installColorChangeHandler((color) =>
        updatePlayerMetadata({ color })
    );

    installSizeChangeHandler((size) =>
        updatePlayerMetadata({ size })
    );

    return uninstallThemeHandler;
}