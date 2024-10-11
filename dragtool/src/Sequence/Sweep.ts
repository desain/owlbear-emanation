import OBR, { isPath, Item, Math2, Path, PathCommand, Vector2 } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../constants";
import { getSweeper, Sweeper } from "../Sweeper";
import { ItemWithMetadata } from "./metadataUtils";
import { isSequenceItem, SequenceItemMetadata } from "./SequenceItem";
import { belongsToSequenceForTarget, getEmanations, getOrCreateSweep } from "./utils";

export type SweepMetadata = SequenceItemMetadata & {
    /**
     * Which emanation the item is for, if it's for one (e.g it's a sweep).
     */
    emanationId: string;
}

export type Sweep = ItemWithMetadata<Path, typeof METADATA_KEY, SweepMetadata>;

export function isSweep(item: Item): item is Sweep {
    return isPath(item) && isSequenceItem(item)
        && 'emanationId' in item.metadata[METADATA_KEY];
}

/**
 * Type that represents the data needed to sweep a path.
 */
export type SweepData = {
    /**
     * Commands from the sweeps for the emanation so far.
     */
    baseCommands: PathCommand[],
    sweeper: Sweeper,
    /**
     * Emanation position offset from target.
     */
    baseOffset: Vector2,
};

export async function getSweeps(target: Item) {
    const emanations = await getEmanations(target.id, OBR.scene.items);
    const existingSweeps: Sweep[] = (await OBR.scene.items.getItems(belongsToSequenceForTarget(target.id)))
        .filter(isSweep);
    const sweeps = await Promise.all(emanations.map((emanation) => getOrCreateSweep(target, emanation, existingSweeps)));
    const sweepDatas: SweepData[] = [];
    for (let i = 0; i < emanations.length; i++) {
        sweepDatas.push({
            sweeper: getSweeper(emanations[i]),
            baseCommands: sweeps[i].commands,
            baseOffset: Math2.subtract(emanations[i].position, target.position),
        });
    }
    return { sweeps, sweepDatas };
}