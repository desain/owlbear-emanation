import OBR, { isImage, Math2, Shape } from "@owlbear-rodeo/sdk";
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

  OBR.scene.items.onChange(async (items) => {
    const gridDpi = await OBR.scene.grid.getDpi();
    const gridMultiplier = (await OBR.scene.grid.getScale()).parsed.multiplier;
    const gridMeasurement = await OBR.scene.grid.getMeasurement();
    await OBR.scene.items.updateItems<Shape>(isEmanation, (emanations) => emanations.forEach((emanation) => {
      const metadata = emanation.metadata[getPluginId("metadata")] as EmanationMetadata;
      const source = emanation.attachedTo;
      if (!source) {
        return;
      }
      const sourceItem = items.find((item) => item.id === source);
      if (!sourceItem || !isImage(sourceItem)) {
        return;
      }
      const newScale = sourceItem.scale;
      if (!Math2.compare(newScale, metadata.sourceScale, 0.01)) {
        metadata.sourceScale = newScale;
        const { width, height, position, shapeType, rotation } = getEmanationParams(sourceItem, gridDpi, gridMultiplier, gridMeasurement, metadata.size);
        emanation.width = width;
        emanation.height = height;
        emanation.position = position;
        emanation.shapeType = shapeType;
        emanation.rotation = rotation;
      }
    }));
  });
  OBR.scene.grid.onChange(async (grid) => {
    const gridDpi = grid.dpi;
    const gridMultiplier = (await OBR.scene.grid.getScale()).parsed.multiplier;
    const gridMeasurement = grid.measurement;
    const items = await OBR.scene.items.getItems();
    await OBR.scene.items.updateItems<Shape>(isEmanation, (emanations) => emanations.forEach((emanation) => {
      const metadata = emanation.metadata[getPluginId("metadata")] as EmanationMetadata;
      const source = emanation.attachedTo;
      if (!source) {
        return;
      }
      const sourceItem = items.find((item) => item.id === source);
      if (!sourceItem || !isImage(sourceItem)) {
        return;
      }
      const { width, height, position, shapeType, rotation } = getEmanationParams(sourceItem, gridDpi, gridMultiplier, gridMeasurement, metadata.size);
      emanation.width = width;
      emanation.height = height;
      emanation.position = position;
      emanation.shapeType = shapeType;
      emanation.rotation = rotation;
    }));
  });
});