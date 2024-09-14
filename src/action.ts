import "./style.css";
import OBR from "@owlbear-rodeo/sdk";
import { getPluginId, SceneEmanationMetadata, updateSceneMetadata } from "./helpers";

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

    document.getElementById('app')!.innerHTML = `
        <label for="grid-mode">Grid Mode</label>
        <input type="checkbox" id="grid-mode" name="grid-mode" ${gridModeChecked} />
    `
    const gridModeCheckbox = <HTMLInputElement>document.getElementById('grid-mode');
    gridModeCheckbox?.addEventListener('change', () => {
        const gridMode = gridModeCheckbox.checked;
        updateSceneMetadata({ gridMode });
    });
}