import OBR, { GridMeasurement, GridType, isCurve, isImage, isShape, Item, Vector2 } from "@owlbear-rodeo/sdk";
import { buildEmanation } from "./builders";

export type EmanationMetadata = {
  sourceScale: Vector2,
  size: number,
  style: EmanationStyle,
}

export interface EmanationStyle {
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeWidth: number;
  strokeDash: number[];
}

export type SceneEmanationMetadata = {
    gridMode: boolean,
    gridDpi: number,
    gridMultiplier: number,
    gridMeasurement: GridMeasurement,
    gridType: GridType,
}

/** Get the reverse domain name id for this plugin at a given path */
export function getPluginId(path: string) {
  return `com.desain.emanation/${path}`;
}

function isPlainObject(
  item: unknown
): item is Record<keyof any, unknown> {
  return (
    item !== null && typeof item === "object" && item.constructor === Object
  );
}

export function getStyle(emanation: Item): EmanationStyle {
  if (isCurve(emanation) || isShape(emanation)) {
    return emanation.style;
  } else {
    const metadata = emanation.metadata[getPluginId("metadata")] as EmanationMetadata;
    return metadata.style;
  }
}

export async function getSceneEmanationMetadata() {
  return (await OBR.scene.getMetadata())[getPluginId('metadata')] as SceneEmanationMetadata | undefined
    ?? {
      gridMode: true,
      gridDpi: await OBR.scene.grid.getDpi(),
      gridMultiplier: (await OBR.scene.grid.getScale()).parsed.multiplier,
      gridMeasurement: await OBR.scene.grid.getMeasurement(),
      gridType: await OBR.scene.grid.getType(),
    };
}

export function isEmanation(item: Item): boolean {
  const metadata = item.metadata[getPluginId("metadata")] as EmanationMetadata;
  return isPlainObject(metadata) && metadata.hasOwnProperty('sourceScale');
}

export async function updateSceneMetadata(metadata: Partial<SceneEmanationMetadata>) {
  const currentMetadata = await getSceneEmanationMetadata();
  const metadataChanged = (Object.keys(metadata) as (keyof SceneEmanationMetadata)[])
    .some((key: keyof SceneEmanationMetadata) => metadata[key] !== currentMetadata[key]);
  if (metadataChanged) {
    const newMetadata: SceneEmanationMetadata = { ...currentMetadata, ...metadata };
    await OBR.scene.setMetadata({ [getPluginId('metadata')]: newMetadata });
    await updateEmanations(() => true);
  }
}

export async function updateEmanations(updateFilter: (_: {metadata: EmanationMetadata, sourceItem: Item}) => boolean) {
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

  const sceneEmanationMetadata = await getSceneEmanationMetadata();
  const replacements = emanationsToUpdate.map(({style, metadata, sourceItem}) => buildEmanation(
    sourceItem,
    style,
    metadata.size,
    sceneEmanationMetadata,
  ));
  const toDelete = emanationsToUpdate.map(({id}) => id);
  await OBR.scene.items.deleteItems(toDelete);
  await OBR.scene.items.addItems(replacements);
}