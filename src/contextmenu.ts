import OBR, { Image, } from "@owlbear-rodeo/sdk";
import {
  EmanationMetadata,
  getPluginId,
  getSceneEmanationMetadata,
  getStyle,
  isEmanation,
} from "./helpers";
import "./style.css";
import { buildEmanation } from "./builders";

/**
 * This file represents the HTML of the popover that is shown once
 * the emanations context menu item is clicked.
 */

interface PlayerMetadata {
  color?: string;
  size?: number;
}

OBR.onReady(renderContextMenu);

async function renderContextMenu() {
  const playerEmanationMetadata = (await OBR.player.getMetadata())[getPluginId('metadata')] as PlayerMetadata | undefined;
  const {parsed: {unit, multiplier}} = await OBR.scene.grid.getScale();

  const selection = await OBR.player.getSelection();
  const extantEmanations = selection?.length == 1
    ? (await OBR.scene.items.getItems(isEmanation))
      .filter((emanation) => emanation.attachedTo == selection[0])
      .map((emanation) => ({emanation, metadata: emanation.metadata[getPluginId('metadata')] as EmanationMetadata}))
      .sort(({metadata: {size: sizeA}}, {metadata: {size: sizeB}}) => sizeA - sizeB)
      .map(({emanation, metadata: {size}}) => {
        return `
          <div class="emanation-row">
            <div class="extant-emanation-color"
                 data-color="${getStyle(emanation).strokeColor}"
                 style="background-color: ${getStyle(emanation).strokeColor};"
            ></div>
            <span class="extant-emanation-size">${size}</span>
            <span class="emanation-unit">${unit}.</span>
            <button class="remove-emanation" data-id="${emanation.id}">Remove</button>
          </div>`
      })
    : ['<p>(Selection is more than 1 item)</p>']

  let size = playerEmanationMetadata?.size ?? multiplier;
  let color = playerEmanationMetadata?.color ?? await OBR.player.getColor();

  // Setup the document with an emanation size input and create button
  document.getElementById('app')!.innerHTML = `
    <div class="emanation-row">
      <input id="emanation-color"
             name="emanation-color"
             type="color"
             value="${color}"/>
      <input id="emanation-size"
             name="emanation-size"
             type="number"
             value="${size}"
             min="0"
             step="${multiplier}"/>
      <span class="emanation-unit">${unit}.</span>
      <button id="create-emanation">Create</button>
    </div>
    ${extantEmanations.join('')}
    <button id="remove-emanations" ${extantEmanations.length === 0 ? 'disabled' : ''}>Remove All</button>
  `;

  const colorInput = <HTMLInputElement>document.getElementById('emanation-color');
  const sizeInput = <HTMLInputElement>document.getElementById('emanation-size');

  // Attach listeners
  colorInput.addEventListener('change', () => {
    console.log('updateColor');
    color = colorInput.value;
    const newMetadata: PlayerMetadata = { color, size };
    OBR.player.setMetadata({ [getPluginId("metadata")]: newMetadata })
  });

  sizeInput.addEventListener('change', () => {
    size = parseFloat(sizeInput.value);
    const newMetadata: PlayerMetadata = { color, size };
    OBR.player.setMetadata({ [getPluginId("metadata")]: newMetadata })
  });

  document.getElementById('create-emanation')?.addEventListener('click', async () => {
    color = colorInput.value;
    size = parseFloat(sizeInput.value);
    if (size > 0) {
      const newPlayerMetadata: PlayerMetadata = { color, size };
      await OBR.player.setMetadata({ [getPluginId("metadata")]: newPlayerMetadata });
      await createEmanations(size, color);
    }
  });

  document.querySelectorAll('.extant-emanation-color').forEach((div) => {
    div.addEventListener('click', async (event) => {
      colorInput.value = (event.target as HTMLElement).dataset.color ?? color;
      colorInput.dispatchEvent(new Event('change'));
    });
  });

  document.querySelectorAll('button.remove-emanation').forEach((button) => {
    button.addEventListener('click', async (event) => {
      const emanationId = (event.target as HTMLButtonElement).dataset.id;
        if (emanationId) {
          await OBR.scene.items.deleteItems([emanationId]);
          await renderContextMenu();
        }
    });
  });
  document.getElementById('remove-emanations')?.addEventListener('click', () => removeAllEmanations());
}

async function removeAllEmanations() {
  const selection = await OBR.player.getSelection();
  if (!selection) {
    return;
  }
  // Get all emanations in the scene
  const emanations = await OBR.scene.items.getItems(isEmanation);
  const emanationsToDelete = emanations.filter((emanation) => emanation.attachedTo && selection.includes(emanation.attachedTo))

  if (emanationsToDelete.length > 0) {
    await OBR.scene.items.deleteItems(emanationsToDelete.map((emanation) => emanation.id));
    await renderContextMenu();
  }
}

async function createEmanations(size: number, color: string) {
  const selection = await OBR.player.getSelection();
  if (!selection) {
    return;
  }
  const sceneEmanationMetadata = await getSceneEmanationMetadata();
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
    sceneEmanationMetadata,
  ));

  if (toAdd.length > 0) {
    await OBR.scene.items.addItems(toAdd);
    await renderContextMenu();
  }
}