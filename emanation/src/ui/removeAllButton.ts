const REMOVE_EMANATIONS = 'remove-emanations';

export function createRemoveAllButton(disabled: boolean) {
    return `<button class="remove btn" id="${REMOVE_EMANATIONS}" ${disabled ? 'disabled' : ''}> - Remove All </button>`
}

export function installRemoveAllHandler(handler: () => void) {
    document.getElementById(REMOVE_EMANATIONS)?.addEventListener('click', handler);
}