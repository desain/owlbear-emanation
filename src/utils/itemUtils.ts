import { Item, Math2 } from "@owlbear-rodeo/sdk";
import { VECTOR2_COMPARE_EPSILON } from "../constants";
import { Aura } from "../types/Aura";
import { CandidateSource, isCandidateSource } from "../types/CandidateSource";
import { isCircle } from "../types/Circle";
import { NotAttachedError } from "../types/Errors";

export function getSource(aura: Aura, networkItems: Item[]): CandidateSource {
    const source = networkItems.find(hasId(aura.attachedTo));
    if (!source || !isCandidateSource(source)) {
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

export function didChangeScale(oldItem: Item, newItem: Item) {
    return (
        !Math2.compare(oldItem.scale, newItem.scale, VECTOR2_COMPARE_EPSILON) ||
        (isCircle(oldItem) &&
            isCircle(newItem) &&
            (oldItem.width !== newItem.width ||
                oldItem.height !== newItem.height))
    );
    return false;
}
