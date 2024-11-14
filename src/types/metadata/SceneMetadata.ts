import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../../constants";
import { makeWatcher } from "../../utils/watchers";

export interface SceneMetadata {
    gridMode: boolean;
}

export function extractSceneMetadataOrDefault(metadata: Metadata) {
    return (
        (metadata[METADATA_KEY] as SceneMetadata | undefined) ?? {
            gridMode: true,
        }
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

export const watchSceneMetadata = makeWatcher(
    getSceneMetadata,
    (cb) => OBR.scene.onMetadataChange(cb),
    getSceneMetadata,
);
