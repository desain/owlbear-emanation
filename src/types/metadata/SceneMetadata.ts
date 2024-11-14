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

export async function updateSceneMetadata(metadata: Partial<SceneMetadata>) {
    const currentMetadata = await getSceneMetadata();
    const newMetadata: SceneMetadata = { ...currentMetadata, ...metadata };
    await OBR.scene.setMetadata({ [METADATA_KEY]: newMetadata });
}
