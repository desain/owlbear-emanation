import createFormControl from './formControl';

const EMANATION_COLOR = 'emanation-color';

export function createColorInput(id: string | null, color: string) {
    return createFormControl('Color', `
        <input type="color"
            class="${EMANATION_COLOR}"
            data-id="${id}"
            value="${color}"
            />
    `);
}

export function installColorChangeHandler(handler: (color: string, id: string | null) => void) {
    document.querySelectorAll<HTMLButtonElement>(`.${EMANATION_COLOR}`).forEach((colorButton) => colorButton.addEventListener('change', () => {
        handler(colorButton.value, colorButton.dataset.id ?? null);
    }));
}