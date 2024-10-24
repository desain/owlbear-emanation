const EMANATION_OPACITY = 'emanation-opacity';

export function createOpacityInput(id: string | null, opacity: number) {
    return `
        <label for="opacity">Opacity:</label>
        <output id="opacity-text">${opacity}</output>
        <input
            type="range"
            data-id="${id}"
            name="opacity"
            class="${EMANATION_OPACITY}"
            min="0"
            max="1"
            step="0.1"
            value="${opacity}"
            oninput="this.previousElementSibling.value = this.value"
            />`
}

export function installOpacityChangeHandler(handler: (opacity: number, id: string | null) => void) {
    document.querySelectorAll<HTMLButtonElement>(`.${EMANATION_OPACITY}`).forEach((opacitySlider) => opacitySlider.addEventListener('change', () => {
        const opacity = parseFloat(opacitySlider.value);
        handler(opacity, opacitySlider.dataset.id ?? null);
    }));
}