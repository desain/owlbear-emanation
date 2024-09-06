import OBR, { Shape, Image, Item, Math2, isImage } from "@owlbear-rodeo/sdk";
import { getPluginId } from "./getPluginId";
import {
  buildEmanation,
  isEmanation,
} from "./helpers";
import "./style.css";

/**
 * This file represents the HTML of the popover that is shown once
 * the emanations context menu item is clicked.
 */

interface PlayerMetadata {
  emanationColor?: string;
}

OBR.onReady(async () => {
  const playerMetadata = await OBR.player.getMetadata();
  const playerEmanationMetadata = playerMetadata[getPluginId("metadata")] as PlayerMetadata | undefined;
  const defaultEmanationColor = playerEmanationMetadata?.emanationColor || await OBR.player.getColor();

  const scale = await OBR.scene.grid.getScale();
  // Setup the document with an emanation size input and create button
  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <div class="emanations">
      <label for="emanation-color">Color:</label>
      <input id="emanation-color" type="color" value="${defaultEmanationColor}"/>
      <br/>
      <input id="emanation-size" type="number" value="0" min="0" step="${scale.parsed.multiplier}"/>
      <span id="emanation-unit">${scale.parsed.unit}.</span>
      <button id="create-emanation">Create</button>
      <br/>
      <button id="remove-emanations">Remove</button>
    </div>
  `;

  const colorInput = <HTMLInputElement>document.getElementById('emanation-color');
  const sizeInput = <HTMLInputElement>document.getElementById('emanation-size');

  // Attach listeners
  colorInput.addEventListener('change', () => {
    const newPlayerEmanationMetadata: PlayerMetadata = { emanationColor: colorInput.value };
    OBR.player.setMetadata({ [getPluginId("metadata")]: newPlayerEmanationMetadata });
  });
  document.getElementById('create-emanation')?.addEventListener('click', () => {
    const size = parseFloat(sizeInput.value)
    const color = colorInput.value;
    if (size > 0) {
        createEmanation(size, color);
    }
  });
  document.getElementById('remove-emanations')?.addEventListener('click', () => {
    removeEmanations();
  });
});

async function removeEmanations() {
  const selection = await OBR.player.getSelection();
  if (!selection) {
    return;
  }
  // Get all emanations in the scene
  const emanations = await OBR.scene.items.getItems<Shape>(isEmanation);

  const circlesToDelete: string[] = [];
  const items = await OBR.scene.items.getItems(selection);
  for (const item of items) {
    const itemEmanations = emanations.filter((emanation) => emanation.attachedTo === item.id);
    circlesToDelete.push(...itemEmanations.map((emanation) => emanation.id));
  }

  if (circlesToDelete.length > 0) {
    await OBR.scene.items.deleteItems(circlesToDelete);
  }
}

async function createEmanation(size: number, color: string) {
  const selection = await OBR.player.getSelection();
  if (!selection) {
    return;
  }
  const dpi = await OBR.scene.grid.getDpi();
  const multiplier = (await OBR.scene.grid.getScale()).parsed.multiplier;

  // Get all selected items
  const items = await OBR.scene.items.getItems<Image>(selection);
  const circlesToAdd = items.map((item) => buildEmanation(
    item,
    color,
    dpi,
    multiplier,
    size,
  ));

  if (circlesToAdd.length > 0) {
    await OBR.scene.items.addItems(circlesToAdd);
  }
}
