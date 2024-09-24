import { Image, isImage, Item, KeyFilter } from "@owlbear-rodeo/sdk";

type DraggableCharacter = Image & {
    layer: 'CHARACTER' | 'MOUNT',
}

export function isDraggableCharacter(target: Item | undefined, requireUnlocked: boolean = true): target is DraggableCharacter {
    return target !== undefined
        && isImage(target)
        && (!requireUnlocked || !target.locked)
        && (target.layer === 'CHARACTER' || target.layer === 'MOUNT');
}

export const DRAGGABLE_CHARACTER_FILTER: KeyFilter[] = [
    {
        key: 'layer',
        value: 'CHARACTER',
        coordinator: '||',
    },
    {
        key: 'layer',
        value: 'MOUNT',
        coordinator: '&&',
    },
    {
        key: 'type',
        value: 'IMAGE',
        coordinator: '&&',
    },
    {
        key: 'locked',
        value: false,
    },
];

export const DRAGGABLE_CHARACTER_FILTER_INVERSE: KeyFilter[] = [
    {
        key: 'layer',
        operator: '!=',
        value: 'CHARACTER',
        coordinator: '&&',
    },
    {
        key: 'layer',
        operator: '!=',
        value: 'MOUNT',
        coordinator: '||',
    },
    {
        key: 'type',
        operator: '!=',
        value: 'IMAGE',
        coordinator: '||',
    },
    {
        key: 'locked',
        value: true,
    },
];
