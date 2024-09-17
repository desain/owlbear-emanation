import OBR, { Math2, Vector2 } from "@owlbear-rodeo/sdk";

import icon from "./status.svg";
import { getPluginId, rebuildEmanations, updateSceneMetadata } from "./helpers";
import AwaitLock from "await-lock";

/**
 * This file represents the background script run when the plugin loads.
 * It creates the context menu item for the emanation.
 */

function vectorsAreCloseEnough(a: Vector2, b: Vector2) {
  return Math2.compare(a, b, 0.01);
}

OBR.onReady(async () => {
  OBR.contextMenu.create({
    id: getPluginId("menu"),
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
      url: "/contextmenu.html",
      // height: 88,
    },
  });

  // Only install global listeners for one instance
  if (await OBR.player.getRole() === 'GM') {
    const emanationReplaceLock = new AwaitLock();
    installItemHandler(emanationReplaceLock);
    installGridHandler(emanationReplaceLock);
  }
});

function installItemHandler(emanationReplaceLock: AwaitLock) {
  OBR.scene.items.onChange(async () => {
    await emanationReplaceLock.acquireAsync();
    try {
      await rebuildEmanations(({metadata, sourceItem}) => {
        return !vectorsAreCloseEnough(sourceItem.scale, metadata.sourceScale)
      });
    } finally {
      emanationReplaceLock.release();
    }
  });
}

function installGridHandler(emanationReplaceLock: AwaitLock) {
  OBR.scene.grid.onChange(async (grid) => {
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