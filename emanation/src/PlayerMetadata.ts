import OBR from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "./constants";

export interface PlayerMetadata {
    color: string;
    size: number;
    defaultOpacity: number;
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