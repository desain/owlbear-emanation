import OBR from '@owlbear-rodeo/sdk';
import { METADATA_KEY } from "../constants";
import { Aura, isAura } from '../types/Aura';
import { didChangeScale, isSource } from '../types/Source';
import { assertItem, getId } from "../utils/itemUtils";

export async function handleScaleChanges() {
    const [
        networkItems,
        localItems,
    ] = await Promise.all([
        OBR.scene.items.getItems(),
        OBR.scene.local.getItems(),
    ]);

    // We want to rebuild auras whose source item changed sizes
    const changedScale = networkItems
        .filter(isSource)
        .filter(didChangeScale)
        .map(getId);

    // Note the new size
    await OBR.scene.items.updateItems(changedScale, (items) => items.forEach((source) => {
        assertItem(source, isSource);
        source.metadata[METADATA_KEY].scale = source.scale;
    }));

    // Update the network items
    const isAttachedToScaleChanger = (aura: Aura) => changedScale.includes(aura.attachedTo);
    const toDelete = localItems
        .filter(isAura)
        .filter(isAttachedToScaleChanger)
        .map(getId);
    await OBR.scene.local.deleteItems(toDelete); // fix is called after this function so they'll come back rebuilt
}