import { attrsToSpecifier, Specifier, specifierToHtml } from './specifier';

const REMOVE_EMANATION = 'remove-emanation';

export function createRemoveEmanationButton(specifier: Specifier) {
    return `
    <button
        class="mdc-icon-button ${REMOVE_EMANATION}"
        ${specifierToHtml(specifier)}
        data-mdc-auto-init="MDCRipple"
    >
        <div class="mdc-icon-button__ripple"></div>
        <span class="mdc-icon-button__focus-ring"></span>
        <i class="material-icons">delete</i>
    </button>
    `;
}

export function installRemoveEmanationHandler(handler: (specifier: Specifier) => void) {
    document.querySelectorAll<HTMLButtonElement>(`.${REMOVE_EMANATION}`).forEach((button) => button.addEventListener('click', async () => {
        const specifier = attrsToSpecifier(button.dataset)!!;
        handler(specifier);
    }));
}