import OBR, { GridScale } from "@owlbear-rodeo/sdk";
const EMANATION_SIZE = 'emanation-size';

export function createSizeInput(id: string | null, size: number, scale: GridScale) {
    return `<input type="number"
                class="${EMANATION_SIZE}"
                value="${size}"
                min="${scale.parsed.multiplier}"
                data-id="${id}"
                step="${scale.parsed.multiplier}"
                />
             <span class="emanation-unit">${scale.parsed.unit}</span>`
}

export function installSizeChangeHandler(handler: (size: number, id: string | null) => void) {
    document.querySelectorAll<HTMLInputElement>(`.${EMANATION_SIZE}`).forEach((sizeInput) => sizeInput.addEventListener('change', () => {
        const size = parseSizeOrWarn(sizeInput.value);
        if (size !== null) {
            handler(size, sizeInput.dataset.id ?? null);
        }
    }));
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