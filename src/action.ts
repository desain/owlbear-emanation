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
    const squareModeChecked = (sceneEmanationMetadata?.squareMode ?? true) ? 'checked' : '';

    document.getElementById('app')!.innerHTML = `
        <label for="square-mode">Square Mode</label>
        <input type="checkbox" id="square-mode" name="square-mode" ${squareModeChecked} />
    `
    const squareModeCheckbox = <HTMLInputElement>document.getElementById('square-mode');
    squareModeCheckbox?.addEventListener('change', () => {
        const squareMode = squareModeCheckbox.checked;
        updateSceneMetadata({ squareMode });
    });
}