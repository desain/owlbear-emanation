import { Image } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../constants";
import { HasMetadata } from '../metadata/metadataUtils';
import { SceneMetadata } from "../metadata/SceneMetadata";
import { Emanation, IsAttached } from "../types/Emanation";
import { EmanationStyle } from '../types/EmanationStyle';
import buildEffectEmanation from "./buildEffectEmanation";
import buildSimpleEmanation from "./buildSimpleEmanation";

/**
 * Helper to build an emanation item.
 * @param item the source item that the emanation radiates from.
 * @param style the emanation style drawing params.
 * @param size the size of the emanation in grid units. E.g size=10ft on a 5-foot grid creates a 2-square emanation.
 * @param gridDpi the dpi of the grid.
 * @param gridMultiplier the multiplier for the grid size.
 * @param measurementType the type of measurement used by the current grid.
 * @param gridType the shape of the current grid.
 * @param gridMode whether to use the square mode for the emanation. Square mode outlines the squares whose centers are included in the emanation.
 *                   Non-square mode outlines the exact shape of the emanation.
 */
export default function buildEmanation(
    item: Image,
    style: EmanationStyle,
    size: number,
    sceneMetadata: SceneMetadata,
): Emanation {

    const numUnits = size / sceneMetadata.gridMultiplier;
    const unitSize = sceneMetadata.gridDpi / item.grid.dpi;
    const absoluteItemSize = Math.max(item.image.width * item.scale.x, item.image.height * item.scale.y) * unitSize;

    const emanation = style.type === 'Simple'
        ? buildSimpleEmanation(sceneMetadata, style, item.position, numUnits, absoluteItemSize)
        : buildEffectEmanation(sceneMetadata, style, item.position, numUnits, absoluteItemSize);

    emanation.locked = true;
    emanation.name = `Emanation ${item.name} ${size}`;
    emanation.layer = 'PROP';
    emanation.disableHit = true;
    emanation.visible = item.visible;
    emanation.attachedTo = item.id;
    emanation.disableAttachmentBehavior = ['ROTATION', 'LOCKED', 'COPY'];

    const metadata = {
        size,
        style,
        ...emanation.metadata[METADATA_KEY] ?? {},
    };
    emanation.metadata[METADATA_KEY] = metadata;

    return emanation as typeof emanation
        & IsAttached
        & HasMetadata<typeof metadata>; // typescript can't figure out these keys are set now;
}