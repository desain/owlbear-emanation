import OBR, { Item, Math2, Vector2 } from "@owlbear-rodeo/sdk";
import { VECTOR2_COMPARE_EPSILON } from "../constants";
import { Aura, isAura } from "../types/Aura";
import { isSource } from "../types/Source";
import { getId } from "../utils/itemUtils";

/**
 * Class that tracks the size of aura sources and deletes auras connected to sources
 */
export class ScaleTracker {
    private sourceToScale: Map<string, Vector2> = new Map();

    async getNeedsRebuild(networkItems: Item[]): Promise<string[]> {
        const localItems = await OBR.scene.local.getItems();

        const sources = networkItems.filter(isSource);
        const sourceIds = new Set(sources.map(getId));

        for (const key of this.sourceToScale.keys()) {
            if (!sourceIds.has(key)) {
                this.sourceToScale.delete(key);
            }
        }

        const changedScale = new Set();
        for (const source of sources) {
            const oldScale = this.sourceToScale.get(getId(source));
            if (
                !oldScale ||
                !Math2.compare(oldScale, source.scale, VECTOR2_COMPARE_EPSILON)
            ) {
                changedScale.add(source.id);
                this.sourceToScale.set(source.id, source.scale);
            }
        }

        // Update the network items
        const isAttachedToScaleChanger = (aura: Aura) =>
            changedScale.has(aura.attachedTo);
        const toDelete = localItems
            .filter(isAura)
            .filter(isAttachedToScaleChanger)
            .map(getId);
        return toDelete;
    }
}
