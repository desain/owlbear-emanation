import OBR, { Math2, Vector2 } from "@owlbear-rodeo/sdk";

import icon from "./status.svg";
import { getPluginId, updateEmanations, updateSceneMetadata } from "./helpers";
import { isHexGrid } from "./hexUtils";

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

  OBR.scene.items.onChange((items) => {
    updateEmanations(items, ({metadata, sourceItem, sceneEmanationMetadata}) => {
      return !vectorsAreCloseEnough(sourceItem.scale, metadata.sourceScale)
             || (isHexGrid(sceneEmanationMetadata.gridType) && !vectorsAreCloseEnough(sourceItem.position, metadata.originalPosition));
    });
  });
  
  OBR.scene.grid.onChange(async (grid) => {
    updateSceneMetadata({
      gridDpi: grid.dpi,
      gridMultiplier: (await OBR.scene.grid.getScale()).parsed.multiplier,
      gridMeasurement: grid.measurement,
      gridType: grid.type,
    })
  });
});