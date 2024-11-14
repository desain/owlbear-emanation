import OBR, { Metadata, Player } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../../constants";
import { makeWatcher } from "../../utils/watchers";
import { AuraStyleType } from "../AuraStyle";

export interface PlayerMetadata {
    styleType: AuraStyleType;
    color: string;
    size: number;
    opacity: number;
}

async function defaultPlayerMetadata(): Promise<PlayerMetadata> {
    return {
        styleType: "Simple",
        size: (await OBR.scene.grid.getScale()).parsed.multiplier,
        color: await OBR.player.getColor(),
        opacity: 0.3,
    };
}

export async function getPlayerMetadata(
    apiMetadata?: Metadata,
): Promise<PlayerMetadata> {
    const metadata = apiMetadata ?? (await OBR.player.getMetadata());
    return (
        (metadata[METADATA_KEY] as PlayerMetadata | undefined) ??
        defaultPlayerMetadata()
    );
}

export async function updatePlayerMetadata(
    metadata: Partial<PlayerMetadata>,
): Promise<PlayerMetadata> {
    const currentMetadata = await getPlayerMetadata();
    const newMetadata = { ...currentMetadata, ...metadata };
    await OBR.player.setMetadata({ [METADATA_KEY]: newMetadata });
    return newMetadata;
}

export const watchPlayerMetadata = makeWatcher(
    getPlayerMetadata,
    (cb) => OBR.player.onChange(cb),
    async (player: Player) => getPlayerMetadata(player.metadata),
);
