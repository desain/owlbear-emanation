import OBR, { GridScale, Image, Item } from "@owlbear-rodeo/sdk";
import "../assets/style.css";
import { METADATA_KEY } from "./constants";
import { createEmanations, Emanation, isEmanation } from "./Emanation";
import installTheme from "./installTheme";
import rebuildEmanations from "./rebuildEmanations";
import { createColorInput, installColorChangeHandler } from "./ui/colorInput";
import { createControlRow } from './ui/controlRow';
import { createNewEmanationButton, installNewEmanationHandler } from "./ui/newEmanationButton";
import { createOpacityInput, installOpacityChangeHandler } from "./ui/opacityInput";
import { createRemoveAllButton, installRemoveAllHandler } from "./ui/removeAllButton";
import { createRemoveEmanationButton, installRemoveEmanationHandler } from "./ui/removeEmanationButton";
import { createSizeInput, installSizeChangeHandler } from "./ui/sizeInput";

function groupBy<T, K extends keyof any>(ts: T[], key: (t: T) => K): Record<K, T[]> {
  return ts.reduce((acc, t) => {
    const k = key(t);
    if (acc[k]) {
      acc[k].push(t);
    } else {
      acc[k] = [t];
    }
    return acc;
  }, {} as Record<K, T[]>);
}

function compareEmanationSize(a: Emanation, b: Emanation) {
  return a.metadata[METADATA_KEY].size - b.metadata[METADATA_KEY].size;
}

function getExtantEmanationHtml(items: Item[], scale: GridScale, selection: string[]): string[] {
  const onlyOneSelection = selection.length === 1;
  const isSelectedEmanation = (item: Item): item is Emanation => isEmanation(item) && selection.includes(item.attachedTo);
  const emanationsAttachedToSelection: Emanation[] = items.filter(isSelectedEmanation);
  const emanationsByAttachedTo = groupBy(emanationsAttachedToSelection, (emanation) => emanation.attachedTo);

  return Object.keys(emanationsByAttachedTo)
    .map((id) => ({ id, name: items.filter((item) => item.id === id)[0].name }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap(({ id, name }) =>
      [
        ...onlyOneSelection ? [] : [`<h5 class="items-emanation-header">${name}</h5>`],
        ...emanationsByAttachedTo[id]
          .sort(compareEmanationSize)
          .map((emanation) => createControlRow(
            createColorInput(emanation.id, emanation.style.strokeColor),
            createSizeInput(emanation.id, emanation.metadata[METADATA_KEY].size, scale),
            createRemoveEmanationButton(emanation.id),
          ) + createOpacityInput(emanation.id, emanation.style.fillOpacity)
          )
      ]
    );
}

/**
 * This file represents the HTML of the popover that is shown once
 * the emanations context menu item is clicked.
 */

OBR.onReady(renderContextMenu);

async function renderContextMenu() {
  const [
    items,
    scale,
    selection,
  ] = await Promise.all([
    OBR.scene.items.getItems(),
    OBR.scene.grid.getScale(),
    OBR.player.getSelection()
  ]);

  const extantEmanations = getExtantEmanationHtml(items, scale, selection ?? [])

  // Setup the document with an emanation size input and create button
  const app = document.getElementById('app')!;
  await installTheme(app, false);
  app.innerHTML =
    extantEmanations.join('')
    + createControlRow(
      createNewEmanationButton(),
      createRemoveAllButton(extantEmanations.length === 0),
    );

  installColorChangeHandler(async (color, id) => {
    await OBR.scene.items.updateItems([id!!], (emanations) => emanations.forEach((emanation: Emanation) => {
      emanation.style.strokeColor = color;
      emanation.style.fillColor = color;
    }));
  });

  installSizeChangeHandler(async (size, id) => {
    await OBR.scene.items.updateItems([id!!], (emanations) => emanations.forEach((emanation: Emanation) => {
      emanation.metadata[METADATA_KEY].size = size;
    }));
    await rebuildEmanations(id!!);
    await renderContextMenu();
  });

  installOpacityChangeHandler(async (opacity, id) => {
    await OBR.scene.items.updateItems([id!!], (emanations) => emanations.forEach((emanation: Emanation) => {
      emanation.style.fillOpacity = opacity;
    }));
  })

  installNewEmanationHandler(async () => {
    const selection = await OBR.player.getSelection();
    const items = await OBR.scene.items.getItems<Image>(selection);
    await createEmanations(items);
    renderContextMenu();
  });

  installRemoveEmanationHandler(removeEmanation);
  installRemoveAllHandler(removeAllEmanations);
}

async function removeEmanation(id: string) {
  const items = await OBR.scene.items.getItems();
  const [attachedTo] = items
    .filter((item) => item.id === id)
    .map((item) => item.attachedTo);
  if (attachedTo === undefined) {
    throw `Emanation ${id} without attachedTo`;
  }
  const otherEmanations = items
    .filter((item) => isEmanation(item) && item.id !== id && item.attachedTo === attachedTo);

  await OBR.scene.items.deleteItems([id]);
  if (otherEmanations.length === 0) {
    await removeItemMetadata([attachedTo]);
  }

  await renderContextMenu();
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
    await removeItemMetadata(selection);
    await renderContextMenu();
  }
}

async function removeItemMetadata(ids: string[]) {
  await OBR.scene.items.updateItems(ids, (items) => items.forEach((item) => {
    item.metadata[METADATA_KEY] = undefined;
  }));
}