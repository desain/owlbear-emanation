import OBR, { GridScale } from "@owlbear-rodeo/sdk";
import * as mdc from "material-components-web";
import createFormControl from './formControl';
import { attrsToSpecifier, Specifier, specifierToHtml } from './specifier';
const AURA_SIZE = 'aura-size';

export function createSizeInput(specifier: Specifier | null, size: number, scale: GridScale) {
    return createFormControl('Size', `
        <label class="mdc-text-field mdc-text-field--outlined mdc-text-field--no-label ${AURA_SIZE}">
            <span class="mdc-notched-outline">
                <span class="mdc-notched-outline__leading"></span>
                <span class="mdc-notched-outline__trailing"></span>
            </span>
            <input
                class="mdc-text-field__input"
                ${specifierToHtml(specifier)}
                type="number"
                inputmode="numeric"
                aria-label="Size"
                min="${scale.parsed.multiplier}"
                value="${size}"
                step="${scale.parsed.multiplier}"
                >
            <span class="mdc-text-field__affix mdc-text-field__affix--suffix">${scale.parsed.unit}</span>
        </label>
    `);
}

export function installSizeChangeHandler(handler: (size: number, specifier: Specifier | null) => void) {
    document.querySelectorAll(`.${AURA_SIZE}`).forEach((elem) => {
        const field = mdc.textField.MDCTextField.attachTo(elem);
        field.listen('change', (event) => {
            const size = parseSizeOrWarn(field.value);
            if (size !== null) {
                handler(size, attrsToSpecifier((event.target as HTMLElement).dataset));
            }
        });
    });
}

function parseSizeOrWarn(newSize: string): number | null {
    const parsed = parseFloat(newSize);
    if (Number.isSafeInteger(parsed) && parsed > 0) {
        return parsed;
    } else {
        OBR.notification.show('Aura size must be greater than 0', 'WARNING');
        return null;
    }
}