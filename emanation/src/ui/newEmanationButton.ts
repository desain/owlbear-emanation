const NEW_EMANATION = 'new-emanation';

export function createNewEmanationButton() {
    return `
    <button
        id="new-emanation"
        class="mdc-button mdc-button--outlined mdc-button--icon-leading"
        data-mdc-auto-init="MDCRipple"
    >
        <span class="mdc-button__ripple"></span>
        <span class="mdc-button__focus-ring"></span>
        <i class="material-icons mdc-button__icon" aria-hidden="true">add_circle</i>
        <span class="mdc-button__label">New</span>
    </button>
    `
}

export function installNewEmanationHandler(handler: () => void) {
    document.getElementById(NEW_EMANATION)?.addEventListener('click', handler);
}