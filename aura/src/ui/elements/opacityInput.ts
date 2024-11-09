import * as mdc from "material-components-web";
import { attrsToSpecifier, Specifier, specifierToHtml } from '../../types/Specifier';
import createFormControl from './formControl';
const AURA_OPACITY = 'aura-opacity';

export function createOpacityInput(specifier: Specifier | null, opacity: number) {
    return createFormControl('Opacity', `
        <div
            class="mdc-slider mdc-slider--discrete ${AURA_OPACITY}"
            ${specifierToHtml(specifier)}
        >
            <div class="mdc-slider__track">
                <div class="mdc-slider__track--inactive"></div>
                <div class="mdc-slider__track--active">
                <div class="mdc-slider__track--active_fill"></div>
                </div>
            </div>
            <div class="mdc-slider__thumb">
                <div class="mdc-slider__value-indicator-container" aria-hidden="true">
                <div class="mdc-slider__value-indicator">
                    <span class="mdc-slider__value-indicator-text">
                    ${opacity * 100}
                    </span>
                </div>
                </div>
                <div class="mdc-slider__thumb-knob"></div>
                <input class="mdc-slider__input"
                    type="range"
                    min="0"
                    max="100"
                    value="${opacity * 100}"
                    name="opacity"
                    aria-label="Opacity"
                    step="10"
                    >
            </div>
        </div>
    `, 'flex-grow: 1');
}

export function installOpacityChangeHandler(handler: (opacity: number, specifier: Specifier | null) => void) {
    document.querySelectorAll(`.${AURA_OPACITY}`).forEach(elem => {
        const slider = mdc.slider.MDCSlider.attachTo(elem);
        slider.listen('MDCSlider:change', (event) => {
            const specifier = attrsToSpecifier((event.target as HTMLElement).dataset);
            handler(slider.getValue() / 100, specifier);
        });
    });
}