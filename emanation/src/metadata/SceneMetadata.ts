import OBR, { GridMeasurement, GridType } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../constants";
import rebuildEmanations from "../rebuildEmanations";

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

export async function updateSceneMetadata(metadata: Partial<SceneMetadata>) {
    const currentMetadata = await getSceneMetadata();
    const metadataChanged = (Object.keys(metadata) as (keyof SceneMetadata)[])
        .some((key: keyof SceneMetadata) => metadata[key] !== currentMetadata[key]);
    if (metadataChanged) {
        const newMetadata: SceneMetadata = { ...currentMetadata, ...metadata };
        await OBR.scene.setMetadata({ [METADATA_KEY]: newMetadata });
        await rebuildEmanations(() => true);
    }
}