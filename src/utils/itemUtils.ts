import type { Item } from "@owlbear-rodeo/sdk";
import { Math2 } from "@owlbear-rodeo/sdk";
import { VECTOR2_COMPARE_EPSILON } from "../constants";
import { isCircle } from "../types/Circle";

export function didChangeScale(oldItem: Item, newItem: Item) {
    return (
        !Math2.compare(oldItem.scale, newItem.scale, VECTOR2_COMPARE_EPSILON) ||
        (isCircle(oldItem) &&
            isCircle(newItem) &&
            (oldItem.width !== newItem.width ||
                oldItem.height !== newItem.height))
    );
}
export interface IsAttached {
    attachedTo: string;
}
