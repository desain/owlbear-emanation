import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../../constants";

export interface SceneMetadata {
    gridMode: boolean;
}

export async function getSceneMetadata(
    apiMetadata?: Metadata,
): Promise<SceneMetadata> {
    const metadata = apiMetadata ?? (await OBR.scene.getMetadata());
    return (
        (metadata[METADATA_KEY] as SceneMetadata | undefined) ?? {
            gridMode: true,
        }
    );
}

export function sceneMetadataChanged(
    newMetadata: Partial<SceneMetadata>,
    oldMetadata: SceneMetadata,
): boolean {
    return (Object.keys(newMetadata) as (keyof SceneMetadata)[]).some(
        (key: keyof SceneMetadata) => newMetadata[key] !== oldMetadata[key],
    );
}

export async function updateSceneMetadata(metadata: Partial<SceneMetadata>) {
    const currentMetadata = await getSceneMetadata();
    const newMetadata: SceneMetadata = { ...currentMetadata, ...metadata };
    await OBR.scene.setMetadata({ [METADATA_KEY]: newMetadata });
}
