import OBR, { Image, Math2 } from "@owlbear-rodeo/sdk";

import AwaitLock from "await-lock";
import add from "../assets/add.svg";
import edit from "../assets/edit.svg";
import { CONTEXTMENU_CREATE_ID, CONTEXTMENU_EDIT_ID, METADATA_KEY, VECTOR2_COMPARE_EPSILON } from "./constants";
import { createEmanations } from "./Emanation";
import { ItemMetadata } from "./metadata/ItemMetadata";
import { updateSceneMetadata } from "./metadata/SceneMetadata";
import rebuildEmanations from "./rebuildEmanations";

/**
 * This file represents the background script run when the plugin loads.
 * It creates the context menu item for the emanation.
 */

export default async function installEmanations() {
  console.log("Emanations version 0.0.10");
  createContextMenu();

  const uninstallers: (() => void)[] = [];
  // Only install global listeners that can change items for one instance
  if (await OBR.player.getRole() === 'GM') {
    const emanationReplaceLock = new AwaitLock();
    uninstallers.push(installItemHandler(emanationReplaceLock));
    uninstallers.push(installGridHandler(emanationReplaceLock));
  }
  return () => uninstallers.forEach((uninstaller) => uninstaller());
}

function createContextMenu() {
  const hasEmanations: keyof ItemMetadata = 'hasEmanations';
  OBR.contextMenu.create({
    id: CONTEXTMENU_CREATE_ID,
    shortcut: 'E',
    icons: [{
      icon: add,
      label: "Add Aura/Emanation",
      filter: {
        every: [
          { key: "type", value: "IMAGE" },
          { key: "layer", value: "CHARACTER" },
          { key: ['metadata', METADATA_KEY], value: undefined }
        ],
        permissions: ["UPDATE"],
      },
    }],
    async onClick(context, _) {
      await createEmanations(context.items as Image[]);
    },
  });
  OBR.contextMenu.create({
    id: CONTEXTMENU_EDIT_ID,
    icons: [
      {
        icon: edit,
        label: "Edit Auras/Emanations",
        filter: {
          every: [
            { key: "type", value: "IMAGE" },
            { key: "layer", value: "CHARACTER" },
          ],
          some: [
            { key: ['metadata', METADATA_KEY, hasEmanations], value: true },
          ],
          permissions: ["UPDATE"],
        },
      },
    ],
    embed: {
      url: "/emanation/contextmenu.html",
      height: 200,
    },
  });
}

function installItemHandler(emanationReplaceLock: AwaitLock) {
  return OBR.scene.items.onChange(async () => {
    await emanationReplaceLock.acquireAsync();
    try {
      await rebuildEmanations(({ metadata, sourceItem }) => {
        return !Math2.compare(sourceItem.scale, metadata.sourceScale, VECTOR2_COMPARE_EPSILON)
      });
    } finally {
      emanationReplaceLock.release();
    }
  });
}

function installGridHandler(emanationReplaceLock: AwaitLock) {
  return OBR.scene.grid.onChange(async (grid) => {
    await emanationReplaceLock.acquireAsync();
    try {
      await updateSceneMetadata({
        gridDpi: grid.dpi,
        gridMultiplier: (await OBR.scene.grid.getScale()).parsed.multiplier,
        gridMeasurement: grid.measurement,
        gridType: grid.type,
      });
    } finally {
      emanationReplaceLock.release();
    }
  });
}