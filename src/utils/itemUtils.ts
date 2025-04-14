import { Item, Math2 } from "@owlbear-rodeo/sdk";
import { hasId } from "owlbear-utils";
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

export function didChangeScale(oldItem: Item, newItem: Item) {
    return (
        !Math2.compare(oldItem.scale, newItem.scale, VECTOR2_COMPARE_EPSILON) ||
        (isCircle(oldItem) &&
            isCircle(newItem) &&
            (oldItem.width !== newItem.width ||
                oldItem.height !== newItem.height))
    );
}
