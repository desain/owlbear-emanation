import OBR, { GridScale } from "@owlbear-rodeo/sdk";
import * as mdc from "material-components-web";
import createFormControl from './formControl';
const EMANATION_SIZE = 'emanation-size';

export function createSizeInput(id: string | null, size: number, scale: GridScale) {
    return createFormControl('Size', `
        <label class="mdc-text-field mdc-text-field--outlined mdc-text-field--no-label ${EMANATION_SIZE}">
            <span class="mdc-notched-outline">
                <span class="mdc-notched-outline__leading"></span>
                <span class="mdc-notched-outline__trailing"></span>
            </span>
            <input
                class="mdc-text-field__input"
                data-id="${id}"
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

export function installSizeChangeHandler(handler: (size: number, id: string | null) => void) {
    document.querySelectorAll(`.${EMANATION_SIZE}`).forEach((elem) => {
        const field = mdc.textField.MDCTextField.attachTo(elem);
        field.listen('change', (event) => {
            const size = parseSizeOrWarn(field.value);
            if (size !== null) {
                handler(size, (event.target as HTMLElement).dataset.id ?? null);
            }
        });
    });
}

function parseSizeOrWarn(newSize: string): number | null {
    const parsed = parseFloat(newSize);
    if (Number.isSafeInteger(parsed) && parsed > 0) {
        return parsed;
    } else {
        OBR.notification.show('Emanation size must be greater than 0', 'WARNING');
        return null;
    }
}