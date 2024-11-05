import { Image, isImage, Item } from '@owlbear-rodeo/sdk';
import { Emanation } from '../types/Emanation';
import { NotAttachedError } from "../types/Errors";

export function getSource(emanation: Emanation, networkItems: Item[]): Image {
    const source = networkItems.find(hasId(emanation.attachedTo));
    if (!source || !isImage(source)) {
        throw new NotAttachedError(emanation.id);
    }
    return source;
}

export function getId(item: Item): string {
    return item.id;
}

export function hasId(id: string): (item: Item) => boolean {
    return (item: Item) => getId(item) === id;
}