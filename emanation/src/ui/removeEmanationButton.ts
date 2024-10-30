const REMOVE_EMANATION = 'remove-emanation';

export function createRemoveEmanationButton(id: string) {
    return `
    <button
        class="mdc-icon-button ${REMOVE_EMANATION}"
        data-id="${id}"
        data-mdc-auto-init="MDCRipple"
    >
        <div class="mdc-icon-button__ripple"></div>
        <span class="mdc-icon-button__focus-ring"></span>
        <i class="material-icons">delete</i>
    </button>
    `;
}

export function installRemoveEmanationHandler(handler: (id: string) => void) {
    document.querySelectorAll<HTMLButtonElement>(`.${REMOVE_EMANATION}`).forEach((button) => button.addEventListener('click', async () => {
        const emanationId = button.dataset.id;
        if (emanationId) {
            handler(emanationId);
        }
    }));
}