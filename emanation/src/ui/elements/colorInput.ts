import createFormControl from './formControl';
import { attrsToSpecifier, Specifier, specifierToHtml } from './specifier';

const EMANATION_COLOR = 'emanation-color';

export function createColorInput(specifier: Specifier | null, color: string) {
    return createFormControl('Color', `
        <label class="color-label" style="background: ${color}">
            <input type="color"
                class="${EMANATION_COLOR}"
                ${specifierToHtml(specifier)}
                value="${color}"
                oninput="this.parentElement.style.background = this.value"
                />
        </label>
    `);
}

export function installColorChangeHandler(handler: (color: string, specifier: Specifier | null) => void) {
    document.querySelectorAll<HTMLButtonElement>(`.${EMANATION_COLOR}`).forEach((colorButton) => colorButton.addEventListener('change', () => {
        handler(colorButton.value, attrsToSpecifier(colorButton.dataset));
    }));
}