/**
 * Way of specifying a specific aura.
 */
export interface Specifier {
    /**
     * Which items has the aura.
     */
    sourceId: string;
    /**
     * Which item in the source's list of auras.
     */
    sourceScopedId: string;
}

/**
 * @returns Data attributes to encode a specifier in an html element
 */
export function specifierToHtml(specifier: Specifier | null) {
    if (!specifier) {
        return '';
    } else {
        return `data-source-id="${specifier.sourceId}" data-scoped-id="${specifier.sourceScopedId}"`;
    }
}

export function attrsToSpecifier(dataset: DOMStringMap): Specifier | null {
    if (dataset.sourceId && dataset.scopedId) {
        return { sourceId: dataset.sourceId, sourceScopedId: dataset.scopedId };
    } else {
        return null;
    }
}