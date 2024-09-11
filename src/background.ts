import OBR, { isCurve, isImage, isShape, Item, Math2 } from "@owlbear-rodeo/sdk";
import { getPluginId } from "./getPluginId";

import icon from "./status.svg";
import { isEmanation, EmanationMetadata, buildEmanation, EmanationStyle } from "./helpers";

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
    const gridType = await OBR.scene.grid.getType();
    const emanationsToUpdate = items.filter(isEmanation)
      .map((emanation) => {
        const sourceItem = items.find((item) => item.id === emanation.attachedTo);
        if (!sourceItem || !isImage(sourceItem)) {
          return null;
        }
        return {
          id: emanation.id,
          style: getStyle(emanation),
          metadata: emanation.metadata[getPluginId("metadata")] as EmanationMetadata, 
          sourceItem,
        };
      })
      .filter(x => x !== null)
      .filter(({metadata, sourceItem}) => {
        const newScale = sourceItem.scale;
        return !Math2.compare(newScale, metadata.sourceScale, 0.01);
      });
    const replacements = emanationsToUpdate.map(({style, metadata, sourceItem}) => buildEmanation(
      sourceItem,
      style,
      metadata.size,
      gridDpi,
      gridMultiplier,
      gridMeasurement,
      gridType,
    ));
    await OBR.scene.items.deleteItems(emanationsToUpdate.map(({id}) => id));
    await OBR.scene.items.addItems(replacements);
  });
  
  OBR.scene.grid.onChange(async (grid) => {
    const gridDpi = grid.dpi;
    const gridMultiplier = (await OBR.scene.grid.getScale()).parsed.multiplier;
    const gridMeasurement = grid.measurement;
    const gridType = grid.type;
    const items = await OBR.scene.items.getItems();

    const emanationsToUpdate = items.filter(isEmanation)
      .map((emanation) => {
        const sourceItem = items.find((item) => item.id === emanation.attachedTo);
        if (!sourceItem || !isImage(sourceItem)) {
          return null;
        }
        return {
          id: emanation.id,
          style: getStyle(emanation),
          metadata: emanation.metadata[getPluginId("metadata")] as EmanationMetadata,
          sourceItem
        };
      })
      .filter((x) => x !== null);
    const replacements = emanationsToUpdate.map(({style, metadata, sourceItem}) => buildEmanation(
      sourceItem,
      style,
      metadata.size,
      gridDpi,
      gridMultiplier,
      gridMeasurement,
      gridType,
    ));
    await OBR.scene.items.deleteItems(emanationsToUpdate.map(({id}) => id));
    await OBR.scene.items.addItems(replacements);
  });
});

function getStyle(emanation: Item): EmanationStyle {
  if (isCurve(emanation)) {
    return emanation.style;
  } else if (isShape(emanation)) {
    return emanation.style;
  } else {
    const metadata = emanation.metadata[getPluginId("metadata")] as EmanationMetadata;
    return metadata.style;
  }
}