import OBR from '@owlbear-rodeo/sdk';
import { AuraEntry } from '../../types/metadata/SourceMetadata';
import { getEntry, isSource } from '../../types/Source';
import { Specifier } from '../../types/Specifier';
import { assertItem } from '../../utils/itemUtils';

export class MenuItem {
    constructor(
        public readonly sourceId: string,
        public readonly aura: AuraEntry,
    ) { }
    toSpecifier(): Specifier {
        return { sourceId: this.sourceId, sourceScopedId: this.aura.sourceScopedId };
    }
    static async fromSpecifier(specifier: Specifier): Promise<MenuItem> {
        const [source] = await OBR.scene.items.getItems([specifier.sourceId]);
        assertItem(source, isSource);
        return new MenuItem(specifier.sourceId, getEntry(source, specifier.sourceScopedId)!!);
    }
    static compare(a: MenuItem, b: MenuItem) {
        return a.aura.size - b.aura.size;
    }
}