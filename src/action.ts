import OBR from "@owlbear-rodeo/sdk";
import { getPluginId, SceneEmanationMetadata, updatePlayerMetadata, updateSceneMetadata } from "./helpers";
import "./style.css";

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
    const sceneEmanationMetadata = (await OBR.scene.getMetadata())[getPluginId('metadata')] as SceneEmanationMetadata | undefined;
    const gridModeChecked = (sceneEmanationMetadata?.gridMode ?? true) ? 'checked' : '';

    const startingOpacity = 0.1;
    document.getElementById('app')!.innerHTML = `
        <label for="grid-mode">Grid Mode</label>
        <input type="checkbox" id="grid-mode" name="grid-mode" ${gridModeChecked} />
        <label for="default-opacity">Default Opacity</label>: <span id="opacity-value">${startingOpacity}</span>
        <input type="range" id="default-opacity" name="default-opacity" min="0" max="1" step="0.1" value="${startingOpacity}" />
    `
    const gridModeCheckbox = <HTMLInputElement>document.getElementById('grid-mode');
    gridModeCheckbox?.addEventListener('change', async () => {
        const gridMode = gridModeCheckbox.checked;
        await updateSceneMetadata({ gridMode });
    });

    const valueDisplay = <HTMLSpanElement>document.getElementById('opacity-value');

    const opacitySlider = <HTMLInputElement>document.getElementById('default-opacity');
    opacitySlider?.addEventListener('change', async () => {
        const opacity = parseFloat(opacitySlider.value);
        valueDisplay.textContent = opacity.toString();
        await updatePlayerMetadata({ defaultOpacity: opacity });
    });
}