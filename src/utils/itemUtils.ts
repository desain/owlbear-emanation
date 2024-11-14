import { Image, isImage, Item } from "@owlbear-rodeo/sdk";
import { Aura } from "../types/Aura";
import { NotAttachedError } from "../types/Errors";

export function getSource(aura: Aura, networkItems: Item[]): Image {
    const source = networkItems.find(hasId(aura.attachedTo));
    if (!source || !isImage(source)) {
        throw new NotAttachedError(aura.id);
    }
    return source;
}

export function getId(item: Item): string {
    return item.id;
}

export function hasId(id: string): (item: Item) => boolean {
    return (item: Item) => getId(item) === id;
}

export function assertItem<T extends Item>(
    item: Item,
    f: (item: Item) => item is T,
): asserts item is T {
    if (!f(item)) {
        throw new Error(`Expected item to be of type ${f.name}`);
    }
}
