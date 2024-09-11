import OBR, { isCurve, isImage, isShape, Item, Math2 } from "@owlbear-rodeo/sdk";

import icon from "./status.svg";
import { isEmanation, EmanationMetadata, buildEmanation, EmanationStyle, getPluginId } from "./helpers";
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
      url: "/",
      // height: 88,
    },
  });

  const emanationReplaceLock = new AwaitLock();
  OBR.scene.items.onChange((items) => updateEmanations(emanationReplaceLock, items, ({metadata, sourceItem}) => {
    const newScale = sourceItem.scale;
    return !Math2.compare(newScale, metadata.sourceScale, 0.01);
  }));
  
  OBR.scene.grid.onChange(async (_) => updateEmanations(emanationReplaceLock, null, _ => true));
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

async function updateEmanations(emanationReplaceLock: AwaitLock, items: Item[] | null, updateFilter: (_: {metadata: EmanationMetadata, sourceItem: Item}) => boolean) {
    await emanationReplaceLock.acquireAsync();
    if (!items) {
      items = await OBR.scene.items.getItems();
    }
    try {
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
        .filter(updateFilter);
      if (emanationsToUpdate.length === 0) {
        return;
      }
      const gridDpi = await OBR.scene.grid.getDpi();
      const gridMultiplier = (await OBR.scene.grid.getScale()).parsed.multiplier;
      const gridMeasurement = await OBR.scene.grid.getMeasurement();
      const gridType = await OBR.scene.grid.getType();
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
    } finally {
      emanationReplaceLock.release();
    }
}