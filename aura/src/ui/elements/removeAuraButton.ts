import { attrsToSpecifier, Specifier, specifierToHtml } from '../../types/Specifier';

const REMOVE_AURA = 'remove-aura';

export function createRemoveAuraButton(specifier: Specifier) {
    return `
    <button
        class="mdc-icon-button ${REMOVE_AURA}"
        ${specifierToHtml(specifier)}
        data-mdc-auto-init="MDCRipple"
    >
        <div class="mdc-icon-button__ripple"></div>
        <span class="mdc-icon-button__focus-ring"></span>
        <i class="material-icons">delete</i>
    </button>
    `;
}

export function installRemoveAuraHandler(handler: (specifier: Specifier) => void) {
    document.querySelectorAll<HTMLButtonElement>(`.${REMOVE_AURA}`).forEach((button) => button.addEventListener('click', async () => {
        const specifier = attrsToSpecifier(button.dataset)!!;
        handler(specifier);
    }));
}