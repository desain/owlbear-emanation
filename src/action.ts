import OBR from "@owlbear-rodeo/sdk";
import { getPluginId, SceneEmanationMetadata, updateSceneMetadata } from "./helpers";

OBR.onReady(() => {
    OBR.scene.onReadyChange((ready) => {
        if (ready) {
            setupSettings();
        }
    });
});

async function setupSettings() {
    const sceneEmanationMetadata = (await OBR.scene.getMetadata())[getPluginId('metadata')] as SceneEmanationMetadata | undefined;
    const gridModeChecked = (sceneEmanationMetadata?.gridMode ?? true) ? 'checked' : '';

    document.getElementById('app')!.innerHTML = `
        <label for="square-mode">Square Mode</label>
        <input type="checkbox" id="square-mode" name="square-mode" ${gridModeChecked} />
    `
    const gridModeCheckbox = <HTMLInputElement>document.getElementById('square-mode');
    gridModeCheckbox?.addEventListener('change', () => {
        const gridMode = gridModeCheckbox.checked;
        updateSceneMetadata({ gridMode });
    });
}