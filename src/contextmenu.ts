import OBR, { Image, } from "@owlbear-rodeo/sdk";
import {
  buildEmanation,
  getPluginId,
  isEmanation,
} from "./helpers";
import "./style.css";

/**
 * This file represents the HTML of the popover that is shown once
 * the emanations context menu item is clicked.
 */

interface PlayerMetadata {
  color?: string;
  size?: number;
}

OBR.onReady(async () => {
  const playerMetadata = await OBR.player.getMetadata();
  const playerEmanationMetadata = playerMetadata[getPluginId("metadata")] as PlayerMetadata | undefined;
  const defaultEmanationColor = playerEmanationMetadata?.color || await OBR.player.getColor();

  const scale = await OBR.scene.grid.getScale();
  // Setup the document with an emanation size input and create button
  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <div class="emanations">
      <input id="emanation-color" type="color" value="${defaultEmanationColor}"/>
      <input id="emanation-size" type="number" value="${playerEmanationMetadata?.size || 0}" min="0" step="${scale.parsed.multiplier}"/>
      <span id="emanation-unit">${scale.parsed.unit}.</span>
      <button id="create-emanation">Create</button>
      <br/>
      <button id="remove-emanations">Remove</button>
    </div>
  `;

  let color: string;
  const colorInput = <HTMLInputElement>document.getElementById('emanation-color');
  const sizeInput = <HTMLInputElement>document.getElementById('emanation-size');

  // Attach listeners
  document.getElementById('create-emanation')?.addEventListener('click', async () => {
    const color = colorInput.value;
    const size = parseFloat(sizeInput.value)
    if (size > 0) {
      const newPlayerMetadata: PlayerMetadata = { color, size };
      await OBR.player.setMetadata({ [getPluginId("metadata")]: newPlayerMetadata });
      await createEmanations(size, color);
    }
  });
  document.getElementById('remove-emanations')?.addEventListener('click', () => removeEmanations());
});

async function removeEmanations() {
  const selection = await OBR.player.getSelection();
  if (!selection) {
    return;
  }
  // Get all emanations in the scene
  const emanations = await OBR.scene.items.getItems(isEmanation);
  const emanationsToDelete = emanations.filter((emanation) => emanation.attachedTo && selection.includes(emanation.attachedTo))

  if (emanationsToDelete.length > 0) {
    await OBR.scene.items.deleteItems(emanationsToDelete.map((emanation) => emanation.id));
  }
}

async function createEmanations(size: number, color: string) {
  const selection = await OBR.player.getSelection();
  if (!selection) {
    return;
  }
  const gridDpi = await OBR.scene.grid.getDpi();
  const gridMultiplier = (await OBR.scene.grid.getScale()).parsed.multiplier;
  const measurementType = await OBR.scene.grid.getMeasurement();
  const gridType = await OBR.scene.grid.getType();

  // Get all selected items
  const items = await OBR.scene.items.getItems<Image>(selection);
  const toAdd = items.map((item) => buildEmanation(
    item,
    {
      fillColor: color,
      fillOpacity: 0,
      strokeColor: color,
      strokeOpacity: 1,
      strokeWidth: 10,
      strokeDash: [],
    },
    size,
    gridDpi,
    gridMultiplier,
    measurementType,
    gridType,
    'SQUARE',
  ));

  if (toAdd.length > 0) {
    await OBR.scene.items.addItems(toAdd);
  }
}