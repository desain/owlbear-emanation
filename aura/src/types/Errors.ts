export class NotAttachedError extends Error {
    constructor(id: string) {
        super(`Aura ${id} is not attached`);
    }
}

export function error(message: string): never {
    throw new Error(message);
}