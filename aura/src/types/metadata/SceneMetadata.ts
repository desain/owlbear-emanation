import OBR, { GridMeasurement, GridType } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../../constants";

export type SceneMetadata = {
    gridMode: boolean,
    gridDpi: number,
    gridMultiplier: number,
    gridMeasurement: GridMeasurement,
    gridType: GridType,
}

export async function getSceneMetadata(): Promise<SceneMetadata> {
    return (await OBR.scene.getMetadata())[METADATA_KEY] as SceneMetadata | undefined
        ?? {
        gridMode: true,
        gridDpi: await OBR.scene.grid.getDpi(),
        gridMultiplier: (await OBR.scene.grid.getScale()).parsed.multiplier,
        gridMeasurement: await OBR.scene.grid.getMeasurement(),
        gridType: await OBR.scene.grid.getType(),
    };
}

export function sceneMetadataChanged(newMetadata: Partial<SceneMetadata>, oldMetadata: SceneMetadata): boolean {
    return (Object.keys(newMetadata) as (keyof SceneMetadata)[])
        .some((key: keyof SceneMetadata) => newMetadata[key] !== oldMetadata[key]);
}

export async function updateSceneMetadata(metadata: Partial<SceneMetadata>) {
    const currentMetadata = await getSceneMetadata();
    const newMetadata: SceneMetadata = { ...currentMetadata, ...metadata };
    await OBR.scene.setMetadata({ [METADATA_KEY]: newMetadata });
}