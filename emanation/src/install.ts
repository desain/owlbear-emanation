import OBR, { Math2 } from "@owlbear-rodeo/sdk";

import AwaitLock from "await-lock";
import icon from "../assets/emanations.svg";
import { MENU_ID, VECTOR2_COMPARE_EPSILON } from "./constants";
import rebuildEmanations from "./rebuildEmanations";
import { updateSceneMetadata } from "./SceneMetadata";

/**
 * This file represents the background script run when the plugin loads.
 * It creates the context menu item for the emanation.
 */

export default async function installEmanations() {
  console.log("Emanations version 0.0.8");
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
  OBR.contextMenu.create({
    id: MENU_ID,
    icons: [
      {
        icon,
        label: "Emanations",
        filter: {
          every: [
            { key: "type", value: "IMAGE" },
            { key: "layer", value: "CHARACTER" },
          ],
          permissions: ["UPDATE"],
        },
      },
    ],
    embed: {
      url: "/emanation/contextmenu.html",
      // height: 88,
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