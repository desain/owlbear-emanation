import OBR, { Item, ItemFilter } from "@owlbear-rodeo/sdk";

export type ItemApi = {
    updateItems(items: ItemFilter<Item> | Item[], updater: (draft: Item[]) => void): Promise<void>,
    addItems(items: Item[]): Promise<void>,
    deleteItems(ids: string[]): Promise<void>,
    getItems<ItemType extends Item>(filter?: ItemFilter<ItemType>): Promise<ItemType[]>,
    onChange(callback: (items: Item[]) => void): () => void;
    getItemAttachments(ids: string[]): Promise<Item[]>;
}

export async function withBothItemApis(f: (api: ItemApi) => Promise<void>) {
    await Promise.all([
        f(OBR.scene.items),
        f(OBR.scene.local),
    ]);
}