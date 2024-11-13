import { AuraEntry } from '../../types/metadata/SourceMetadata';
import { Specifier } from '../../types/Specifier';

export class MenuItem {
    constructor(
        public readonly sourceId: string,
        public readonly aura: AuraEntry,
    ) { }
    toKey() {
        return `${this.sourceId}/${this.aura.sourceScopedId}`;
    }
    toSpecifier(): Specifier {
        return { sourceId: this.sourceId, sourceScopedId: this.aura.sourceScopedId };
    }
    static compare(this: void, a: MenuItem, b: MenuItem) {
        return a.aura.size - b.aura.size;
    }
}