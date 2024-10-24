const REMOVE_EMANATION = 'remove-emanation';

export function createRemoveEmanationButton(id: string) {
    return `<button class="remove btn ${REMOVE_EMANATION}" data-id="${id}">- Remove</button>`;
}

export function installRemoveEmanationHandler(handler: (id: string) => void) {
    document.querySelectorAll<HTMLButtonElement>(`.${REMOVE_EMANATION} `).forEach((button) => button.addEventListener('click', async () => {
        const emanationId = button.dataset.id;
        if (emanationId) {
            handler(emanationId);
        }
    }));
}