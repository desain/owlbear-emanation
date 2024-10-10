import OBR, { Item } from "@owlbear-rodeo/sdk";
import { ItemApi } from "./ItemApi";

/**
 * Type that abstracts over a network interaction or a local item interaction
 */
export type AbstractInteraction<T> = {
    update(updater: (value: T) => void): Promise<T>,
    keepAndStop(toReAdd: T): Promise<void>,
    itemApi: ItemApi,
}

export async function wrapRealInteraction(items: Item[]): Promise<AbstractInteraction<Item[]>> {
    const [update, stop] = await OBR.interaction.startItemInteraction(items);
    return {
        async update(updater: (_: Item[]) => void) {
            return update(updater);
        },
        async keepAndStop(items: Item[]) {
            await OBR.scene.items.addItems(items);
            stop();
        },
        itemApi: OBR.scene.items,
    };
}

export async function createLocalInteraction(items: Item[]): Promise<AbstractInteraction<Item[]>> {
    const ids = items.map((item) => item.id);
    const existingIds = (await OBR.scene.local.getItems(ids)).map((item) => item.id);
    const newItems = items.filter((item) => !existingIds.includes(item.id));
    await OBR.scene.local.addItems(newItems);
    return {
        async update(updater: (_: Item[]) => void) {
            OBR.scene.local.updateItems(ids, updater);
            return OBR.scene.local.getItems(ids);
        },
        async keepAndStop(items: Item[]) {
            const idsToKeep = items.map((item) => item.id);
            const toDelete = newItems
                .map((item) => item.id)
                .filter((id) => !idsToKeep.includes(id));
            await OBR.scene.local.deleteItems(toDelete);
        },
        itemApi: OBR.scene.local,
    };
}