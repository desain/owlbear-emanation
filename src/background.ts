import OBR, { Math2, Vector2 } from "@owlbear-rodeo/sdk";

import AwaitLock from "await-lock";
import { installTool } from "./dragtool";
import icon from "./emanations.svg";
import { getPluginId, rebuildEmanations, updateSceneMetadata } from "./helpers";

/**
 * This file represents the background script run when the plugin loads.
 * It creates the context menu item for the emanation.
 */

function vectorsAreCloseEnough(a: Vector2, b: Vector2) {
  return Math2.compare(a, b, 0.01);
}

OBR.onReady(async () => {
  if (await OBR.scene.isReady()) {
    await install();
  } else {
    OBR.scene.onReadyChange(async (ready) => {
      if (ready) {
        await install();
      }
    });
  }
});

async function install() {
  console.log("Emanations version 0.0.5");
  createContextMenu();

  // Only install global listeners that can change items for one instance
  if (await OBR.player.getRole() === 'GM') {
    const emanationReplaceLock = new AwaitLock();
    const uninstallItemHandler = installItemHandler(emanationReplaceLock);
    const uninstallGridHandler = installGridHandler(emanationReplaceLock);
    const uninstallReadyHandler = OBR.scene.onReadyChange((ready) => {
      if (!ready) {
        uninstallItemHandler();
        uninstallGridHandler();
        uninstallReadyHandler();
      }
    });
  }

  installTool();
}

function installItemHandler(emanationReplaceLock: AwaitLock) {
  return OBR.scene.items.onChange(async () => {
    await emanationReplaceLock.acquireAsync();
    try {
      await rebuildEmanations(({ metadata, sourceItem }) => {
        return !vectorsAreCloseEnough(sourceItem.scale, metadata.sourceScale)
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

function createContextMenu() {
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
}