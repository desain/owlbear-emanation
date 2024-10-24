import OBR, { isImage, Item } from "@owlbear-rodeo/sdk";
import buildEmanation from "./Builders/buildEmanation";
import { METADATA_KEY } from "./constants";
import { EmanationMetadata, isEmanation } from "./Emanation";
import { getSceneMetadata } from "./metadata/SceneMetadata";

type Predicate = (_: { metadata: EmanationMetadata, sourceItem: Item, id: string }) => boolean;


export default async function rebuildEmanations(updateFilter: Predicate | string) {
  const filterFunction: Predicate = typeof updateFilter === 'function'
    ? updateFilter
    : ({ id }) => id === updateFilter;

  const allItems = await OBR.scene.items.getItems();
  const emanationsToUpdate = allItems.filter(isEmanation)
    .map((emanation) => {
      const sourceItem = allItems.find((item) => item.id === emanation.attachedTo);
      if (!sourceItem || !isImage(sourceItem)) {
        console.warn(`Can't find source image ${emanation.attachedTo}`)
        return null;
      }
      return {
        id: emanation.id,
        style: emanation.style,
        metadata: emanation.metadata[METADATA_KEY],
        sourceItem,
      };
    })
    .filter(x => x !== null)
    .filter(filterFunction);

  if (emanationsToUpdate.length === 0) {
    return;
  }

  const sceneMetadata = await getSceneMetadata();
  const replacements = emanationsToUpdate.map(({ style, metadata, sourceItem }) => buildEmanation(
    sourceItem,
    style,
    metadata.size,
    sceneMetadata,
  ));
  const toDelete = emanationsToUpdate.map(({ id }) => id);
  await OBR.scene.items.deleteItems(toDelete);
  await OBR.scene.items.addItems(replacements);
}