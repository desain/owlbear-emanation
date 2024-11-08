import * as mdc from 'material-components-web';
import { AuraStyleType, STYLE_TYPES } from '../../types/AuraStyle';
import createFormControl from './formControl';
import { attrsToSpecifier, Specifier, specifierToHtml } from './specifier';
const AURA_STYLE = 'aura-style';

function selectItem(value: string, selected: boolean) {
    const selectedClass = selected ? 'mdc-deprecated-list-item--selected' : '';
    return `
        <li class="mdc-deprecated-list-item ${selectedClass}" aria-selected="${selected}" data-value="${value}" role="option">
            <span class="mdc-deprecated-list-item__ripple"></span>
            <span class="mdc-deprecated-list-item__text">${value}</span>
        </li>
    `;
}

export function createStyleSelect(specifier: Specifier | null, selectedOption: AuraStyleType) {
    return createFormControl('Style', `
        <div
            class="mdc-select mdc-select--outlined ${AURA_STYLE}"
            ${specifierToHtml(specifier)}
        >
            <div class="mdc-select__anchor" aria-labelledby="outlined-select-label">
                <span class="mdc-notched-outline">
                    <span class="mdc-notched-outline__leading"></span>
                    <!--
                    <span class="mdc-notched-outline__notch">
                        <span id="outlined-select-label" class="mdc-floating-label">Style</span>
                    </span>
                    -->
                    <span class="mdc-notched-outline__trailing"></span>
                </span>
                <span class="mdc-select__selected-text-container">
                    <span id="demo-selected-text" class="mdc-select__selected-text">${selectedOption}</span>
                </span>
                <span class="mdc-select__dropdown-icon">
                <svg
                    class="mdc-select__dropdown-icon-graphic"
                    viewBox="7 10 10 5" focusable="false">
                    <polygon
                        class="mdc-select__dropdown-icon-inactive"
                        stroke="none"
                        fill-rule="evenodd"
                        points="7 10 12 15 17 10">
                    </polygon>
                    <polygon
                        class="mdc-select__dropdown-icon-active"
                        stroke="none"
                        fill-rule="evenodd"
                        points="7 15 12 10 17 15">
                    </polygon>
                </svg>
                </span>
            </div>

            <div class="mdc-select__menu mdc-menu mdc-menu-surface mdc-menu-surface--fullwidth">
                <ul class="mdc-deprecated-list" role="listbox" aria-label="Style selector">
                    ${STYLE_TYPES.map((option) => selectItem(option, option === selectedOption)).join('')}
                </ul>
            </div>
        </div>
    `);
}

export function installStyleChangeHandler(handler: (style: AuraStyleType, specifier: Specifier | null) => void) {
    document.querySelectorAll<HTMLElement>(`.${AURA_STYLE}`).forEach((element) => {
        const select = mdc.select.MDCSelect.attachTo(element);
        select.listen('MDCSelect:change', () => {
            handler(select.value as AuraStyleType, attrsToSpecifier(element.dataset));
        });
    });
}