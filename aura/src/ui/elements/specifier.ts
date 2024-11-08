export interface Specifier {
    sourceId: string;
    sourceScopedId: string;
}

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