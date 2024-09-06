import OBR, { isImage, Item, Math2, Shape } from "@owlbear-rodeo/sdk";
import { getPluginId } from "./getPluginId";

import icon from "./status.svg";
import { isEmanation, EmanationMetadata, getEmanationParams } from "./helpers";

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
      url: "/",
      // height: 88,
    },
  });

  OBR.scene.items.onChange(fixEmanationSizes);
});

async function fixEmanationSizes(items: Item[]) {
  const dpi = await OBR.scene.grid.getDpi();
  const multiplier = (await OBR.scene.grid.getScale()).parsed.multiplier;

  await OBR.scene.items.updateItems<Shape>(isEmanation, (emanations) => {
    for (const emanation of emanations) {
      const metadata = emanation.metadata[getPluginId("metadata")] as EmanationMetadata;
      const source = emanation.attachedTo;
      if (!source) {
        continue;
      }
      const sourceItem = items.find((item) => item.id === source);
      if (!sourceItem || !isImage(sourceItem)) {
        continue;
      }
      const newScale = sourceItem.scale;
      if (!Math2.compare(newScale, metadata.sourceScale, 0.01)) {
        metadata.sourceScale = newScale;
        const { diameter, position } = getEmanationParams(sourceItem, dpi, multiplier, metadata.size);
        emanation.width = diameter;
        emanation.height = diameter;
        emanation.position = position;
      }
    }
  });
}