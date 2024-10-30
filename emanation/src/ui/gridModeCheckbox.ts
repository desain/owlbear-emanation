import OBR from "@owlbear-rodeo/sdk";
import * as mdc from "material-components-web";

const GRID_MODE_CHECKBOX = 'grid-mode-checkbox';

export function createGridModeCheckbox(role: Awaited<ReturnType<typeof OBR.player.getRole>>, gridMode: boolean) {
    if (role !== 'GM') {
        return '';
    }
    return `
        <div class="mdc-form-field">
            <div class="mdc-checkbox ${GRID_MODE_CHECKBOX}">
                <input type="checkbox"
                    class="mdc-checkbox__native-control"
                    id="checkbox-1"
                    ${gridMode ? 'checked' : ''}
                    />
                <div class="mdc-checkbox__background">
                <svg class="mdc-checkbox__checkmark"
                    viewBox="0 0 24 24">
                    <path class="mdc-checkbox__checkmark-path"
                        fill="none"
                        d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
                </svg>
                <div class="mdc-checkbox__mixedmark"></div>
                </div>
                <div class="mdc-checkbox__ripple"></div>
                <div class="mdc-checkbox__focus-ring"></div>
            </div>
            <label for="checkbox-1">Grid Mode</label>
        </div>
    `;
}

export function installGridModeChangeHandler(handler: (gridMode: boolean) => void) {
    document.querySelectorAll(`.${GRID_MODE_CHECKBOX}`).forEach((elem) => {
        const checkbox = mdc.checkbox.MDCCheckbox.attachTo(elem);
        checkbox.listen('change', () => {
            handler(checkbox.checked);
        });
    });
}