import "./style.css";
import OBR, { Image, } from "@owlbear-rodeo/sdk";
import {
  Emanation,
  EmanationMetadata,
  getPluginId,
  getSceneEmanationMetadata,
  getStyle,
  isEmanation,
  rebuildEmanations,
  PlayerMetadata,
  updatePlayerMetadata,
} from "./helpers";
import { buildEmanation } from "./builders";

/**
 * This file represents the HTML of the popover that is shown once
 * the emanations context menu item is clicked.
 */

OBR.onReady(renderContextMenu);

const NEW_EMANATION = 'new-emanation';
const EXTANT_EMANATION = 'extant-emanation';
const EMANATION_COLOR = 'emanation-color';
const EMANATION_SIZE = 'emanation-size';
const CREATE_EMANATION = 'create-emanation';
const REMOVE_EMANATION = 'remove-emanation';

function emanationRow(id: string | null, color: string, size: number, multiplier: number, unit: string) {
  const isNew = id === null;
  const buttonText = isNew ? '+ Create' : '- Remove';
  const buttonClass = isNew ? CREATE_EMANATION : REMOVE_EMANATION;
  const extantClass = isNew ? NEW_EMANATION : EXTANT_EMANATION;

  return `<div class="emanation-row">
      <input type="color"
             class="${extantClass} ${EMANATION_COLOR}"
             data-id="${id}"
             value="${color}"
             />
      <input type="number"
             class="${extantClass} ${EMANATION_SIZE}"
             value="${size}"
             min="${multiplier}"
             data-id="${id}"
             step="${multiplier}"
             />
      <span class="emanation-unit">${unit}.</span>
      <button class="crud action ${buttonClass}" data-id="${id}">${buttonText}</button>
    </div>`;
}

async function renderContextMenu() {
  const playerEmanationMetadata = (await OBR.player.getMetadata())[getPluginId('metadata')] as PlayerMetadata | undefined;
  const {parsed: {unit, multiplier}} = await OBR.scene.grid.getScale();

  const selection = await OBR.player.getSelection();
  const extantEmanations = selection?.length === 1
    ? (await OBR.scene.items.getItems(isEmanation))
      .filter((emanation) => emanation.attachedTo == selection[0])
      .map((emanation) => ({emanation, metadata: emanation.metadata[getPluginId('metadata')] as EmanationMetadata}))
      .sort(({metadata: {size: sizeA}}, {metadata: {size: sizeB}}) => sizeA - sizeB)
      .map(({emanation, metadata: {size}}) => emanationRow(
        emanation.id, getStyle(emanation).strokeColor, size, multiplier, unit))
    : ['<p>(Selection is more than 1 item)</p>']

  let size = playerEmanationMetadata?.size ?? multiplier;
  let color = playerEmanationMetadata?.color ?? await OBR.player.getColor();

  // Setup the document with an emanation size input and create button
  document.getElementById('app')!.innerHTML = `
    ${emanationRow(null, color, size, multiplier, unit)}
    ${extantEmanations.join('')}
    <button class="action" id="remove-emanations" ${extantEmanations.length === 0 ? 'disabled' : ''}>- Remove All</button>
  `;

  // Attach listeners
  document.querySelectorAll<HTMLButtonElement>(`.${NEW_EMANATION}.${EMANATION_COLOR}`).forEach((colorButton) => colorButton.addEventListener('change', async () => {
    color = colorButton.value;
    await updatePlayerMetadata({color});
  }));

  document.querySelectorAll<HTMLInputElement>(`.${NEW_EMANATION}.${EMANATION_SIZE}`).forEach((sizeInput) => sizeInput.addEventListener('change', async () => {
    size = parseFloat(sizeInput.value);
    await updatePlayerMetadata({size});
  }));

  document.querySelectorAll<HTMLButtonElement>(`.${EXTANT_EMANATION}.${EMANATION_COLOR}`).forEach((colorButton) => colorButton.addEventListener('change', async () => {
    const id = colorButton.dataset.id!!;
    await OBR.scene.items.updateItems<Emanation>([id], (emanations) => emanations.forEach((emanation) => {
      emanation.style.strokeColor = colorButton.value;
      emanation.style.fillColor = colorButton.value;
      const metadata = emanation.metadata[getPluginId('metadata')] as EmanationMetadata;
      metadata.style.strokeColor = colorButton.value;
      metadata.style.fillColor = colorButton.value;
    }));
  }));

  document.querySelectorAll<HTMLInputElement>(`.${EXTANT_EMANATION}.${EMANATION_SIZE}`).forEach((sizeInput) => sizeInput.addEventListener('change', async () => {
    const id = sizeInput.dataset.id!!;
    const size = parseFloat(sizeInput.value);
    await OBR.scene.items.updateItems<Emanation>([id], (emanations) => emanations.forEach((emanation) => {
      const metadata = emanation.metadata[getPluginId('metadata')] as EmanationMetadata;
      metadata.size = size;
    }));
    await rebuildEmanations(({id: otherId}) => otherId === id);
    await renderContextMenu();
  }));

  document.querySelectorAll(`.${CREATE_EMANATION}`).forEach((button) => button.addEventListener('click', async () => {
    if (size > 0) {
      const newPlayerMetadata: PlayerMetadata = await updatePlayerMetadata({size, color});
      await createEmanations(newPlayerMetadata);
    } else {
      await OBR.notification.show('Emanation size must be greater than 0', 'WARNING');
    }
  }));

  document.querySelectorAll(`.${REMOVE_EMANATION}`).forEach((button) => button.addEventListener('click', async (event) => {
    const emanationId = (event.target as HTMLButtonElement).dataset.id;
    if (emanationId) {
      await OBR.scene.items.deleteItems([emanationId]);
      await renderContextMenu();
    }
  }));;

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

async function createEmanations({size, color, defaultOpacity}: PlayerMetadata) {
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
      fillOpacity: defaultOpacity,
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