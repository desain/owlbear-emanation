export class NotAttachedError extends Error {
    constructor(emanationId: string) {
        super(`Emanation ${emanationId} is not attached`);
    }
}

export function error(message: string): never {
    throw new Error(message);
}