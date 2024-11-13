import OBR, { GridMeasurement, GridType, Metadata } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../../constants";

export type SceneMetadata = {
    gridMode: boolean,
    gridDpi: number,
    gridMultiplier: number,
    gridMeasurement: GridMeasurement,
    gridType: GridType,
}

async function defaultSceneMetadata(): Promise<SceneMetadata> {
    return {
        gridMode: true,
        gridDpi: await OBR.scene.grid.getDpi(),
        gridMultiplier: (await OBR.scene.grid.getScale()).parsed.multiplier,
        gridMeasurement: await OBR.scene.grid.getMeasurement(),
        gridType: await OBR.scene.grid.getType(),
    };
}

export async function getSceneMetadata(apiMetadata?: Metadata): Promise<SceneMetadata> {
    const metadata = apiMetadata ?? await OBR.scene.getMetadata();
    return metadata[METADATA_KEY] as SceneMetadata | undefined ?? defaultSceneMetadata();
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