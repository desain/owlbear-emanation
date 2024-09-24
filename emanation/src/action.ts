import OBR from "@owlbear-rodeo/sdk";
import "../assets/style.css";
import { getPlayerMetadata, updatePlayerMetadata } from "./PlayerMetadata";
import { getSceneMetadata, updateSceneMetadata } from "./SceneMetadata";

OBR.onReady(async () => {
    const ready = await OBR.scene.isReady();
    if (ready) {
        await setupSettings();
    } else {
        OBR.scene.onReadyChange(async (ready) => {
            if (ready) {
                await setupSettings();
            }
        });
    }
});

async function setupSettings() {
    const sceneEmanationMetadata = await getSceneMetadata();
    const playerMetadata = await getPlayerMetadata();
    const gridModeChecked = sceneEmanationMetadata.gridMode ? 'checked' : '';
    const startingOpacity = playerMetadata.defaultOpacity;

    const gmControls = await OBR.player.getRole() === 'GM'
        ? `<label for="grid-mode">Grid Mode</label><input type="checkbox" id="grid-mode" name="grid-mode" ${gridModeChecked} />`
        : '';

    document.getElementById('app')!.innerHTML = `
        ${gmControls}
        <label for="default-opacity">Default Opacity</label>: <span id="opacity-value">${startingOpacity}</span>
        <input type="range" id="default-opacity" name="default-opacity" min="0" max="1" step="0.1" value="${startingOpacity}" />
    `
    const gridModeCheckbox = <HTMLInputElement | null>document.getElementById('grid-mode');
    gridModeCheckbox?.addEventListener('change', async () => {
        const gridMode = gridModeCheckbox.checked;
        await updateSceneMetadata({ gridMode });
    });

    const opacityValueDisplay = <HTMLSpanElement>document.getElementById('opacity-value');
    const opacitySlider = <HTMLInputElement | null>document.getElementById('default-opacity');
    opacitySlider?.addEventListener('change', async () => {
        const opacity = parseFloat(opacitySlider.value);
        opacityValueDisplay.textContent = opacity.toString();
        await updatePlayerMetadata({ defaultOpacity: opacity });
    });
}