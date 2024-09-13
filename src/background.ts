import OBR, { Math2 } from "@owlbear-rodeo/sdk";

import icon from "./status.svg";
import { getPluginId, updateEmanations, updateSceneMetadata } from "./helpers";

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

  OBR.scene.items.onChange((items) => {
    updateEmanations(items, ({metadata, sourceItem}) => {
      const newScale = sourceItem.scale;
      return !Math2.compare(newScale, metadata.sourceScale, 0.01);
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