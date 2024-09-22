import OBR, { isImage, Item } from "@owlbear-rodeo/sdk";
import { buildEmanation } from "./builders";
import { EmanationMetadata, isEmanation, METADATA_KEY, PlayerMetadata, SceneEmanationMetadata } from "./types";

export async function getSceneEmanationMetadata(): Promise<SceneEmanationMetadata> {
  return (await OBR.scene.getMetadata())[METADATA_KEY] as SceneEmanationMetadata | undefined
    ?? {
    gridMode: true,
    gridDpi: await OBR.scene.grid.getDpi(),
    gridMultiplier: (await OBR.scene.grid.getScale()).parsed.multiplier,
    gridMeasurement: await OBR.scene.grid.getMeasurement(),
    gridType: await OBR.scene.grid.getType(),
  };
}

export async function updateSceneMetadata(metadata: Partial<SceneEmanationMetadata>) {
  const currentMetadata = await getSceneEmanationMetadata();
  const metadataChanged = (Object.keys(metadata) as (keyof SceneEmanationMetadata)[])
    .some((key: keyof SceneEmanationMetadata) => metadata[key] !== currentMetadata[key]);
  if (metadataChanged) {
    const newMetadata: SceneEmanationMetadata = { ...currentMetadata, ...metadata };
    await OBR.scene.setMetadata({ [METADATA_KEY]: newMetadata });
    await rebuildEmanations(() => true);
  }
}

export async function getPlayerMetadata(): Promise<PlayerMetadata> {
  return (await OBR.player.getMetadata())[METADATA_KEY] as PlayerMetadata | undefined
    ?? {
    size: (await OBR.scene.grid.getScale()).parsed.multiplier,
    color: await OBR.player.getColor(),
    defaultOpacity: 0.3,
  };
}

export async function updatePlayerMetadata(metadata: Partial<PlayerMetadata>): Promise<PlayerMetadata> {
  const currentMetadata = await getPlayerMetadata();
  const newMetadata = { ...currentMetadata, ...metadata };
  await OBR.player.setMetadata({ [METADATA_KEY]: newMetadata });
  return newMetadata;
  // Don't need to rebuild here
}

export async function rebuildEmanations(updateFilter: (_: { metadata: EmanationMetadata, sourceItem: Item, id: string }) => boolean) {
  const allItems = await OBR.scene.items.getItems();
  const emanationsToUpdate = allItems.filter(isEmanation)
    .map((emanation) => {
      const sourceItem = allItems.find((item) => item.id === emanation.attachedTo);
      if (!sourceItem || !isImage(sourceItem)) {
        console.warn(`Can't find source item ${emanation.attachedTo}`)
        return null;
      }
      return {
        id: emanation.id,
        style: emanation.style,
        metadata: emanation.metadata[METADATA_KEY] as EmanationMetadata,
        sourceItem,
      };
    })
    .filter(x => x !== null)
    .filter(updateFilter);

  if (emanationsToUpdate.length === 0) {
    return;
  }

  const sceneEmanationMetadata = await getSceneEmanationMetadata();
  const replacements = emanationsToUpdate.map(({ style, metadata, sourceItem }) => buildEmanation(
    sourceItem,
    style,
    metadata.size,
    sceneEmanationMetadata,
  ));
  const toDelete = emanationsToUpdate.map(({ id }) => id);
  await OBR.scene.items.deleteItems(toDelete);
  await OBR.scene.items.addItems(replacements);
}