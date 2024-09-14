import OBR, { Math2, Vector2 } from "@owlbear-rodeo/sdk";

import icon from "./status.svg";
import { getPluginId, updateEmanations, updateSceneMetadata } from "./helpers";
import AwaitLock from "await-lock";

/**
 * This file represents the background script run when the plugin loads.
 * It creates the context menu item for the emanation.
 */

OBR.onReady(() => {
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

  function vectorsAreCloseEnough(a: Vector2, b: Vector2) {
    return Math2.compare(a, b, 0.01);
  }

  const emanationReplaceLock = new AwaitLock();

  OBR.scene.items.onChange(async () => {
    await emanationReplaceLock.acquireAsync();
    try {
      await updateEmanations(({metadata, sourceItem}) => {
        return !vectorsAreCloseEnough(sourceItem.scale, metadata.sourceScale)
      });
    } finally {
      emanationReplaceLock.release();
    }
  });
  
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
});