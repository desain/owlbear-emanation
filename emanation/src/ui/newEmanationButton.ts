const NEW_EMANATION = 'new-emanation';

export function createNewEmanationButton() {
    return '<button class="btn" id="new-emanation">+ New</button>'
}

export function installNewEmanationHandler(handler: () => void) {
    document.getElementById(NEW_EMANATION)?.addEventListener('click', handler);
}