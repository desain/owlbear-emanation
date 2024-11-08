const REMOVE_AURAS = 'remove-auras';

export function createRemoveAllButton() {
    return `
    <button
        id="${REMOVE_AURAS}"
        class="mdc-button mdc-button--outlined mdc-button--icon-leading"
        data-mdc-auto-init="MDCRipple"
    >
        <span class="mdc-button__ripple"></span>
        <span class="mdc-button__focus-ring"></span>
        <i class="material-icons mdc-button__icon" aria-hidden="true">delete_forever</i>
        <span class="mdc-button__label">Delete All</span>
    </button>
    `;
}

export function installRemoveAllHandler(handler: () => void) {
    document.getElementById(REMOVE_AURAS)?.addEventListener('click', handler);
}