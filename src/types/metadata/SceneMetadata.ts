import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../../constants";
import { AuraShape } from "../AuraShape";

export interface SceneMetadata {
    gridMode: boolean;
    shapeOverride?: AuraShape;
}

export const DEFAULT_SCENE_METADATA: SceneMetadata = {
    gridMode: true,
};

export function extractSceneMetadataOrDefault(
    metadata: Metadata,
): SceneMetadata {
    return (
        (metadata[METADATA_KEY] as SceneMetadata | undefined) ??
        DEFAULT_SCENE_METADATA
    );
}

async function getSceneMetadata(
    apiMetadata?: Metadata,
): Promise<SceneMetadata> {
    const metadata = apiMetadata ?? (await OBR.scene.getMetadata());
    return extractSceneMetadataOrDefault(metadata);
}

export async function updateSceneMetadata(metadata: Partial<SceneMetadata>) {
    const currentMetadata = await getSceneMetadata();
    const newMetadata: SceneMetadata = { ...currentMetadata, ...metadata };
    await OBR.scene.setMetadata({ [METADATA_KEY]: newMetadata });
}
