import type { Vector2 } from "@owlbear-rodeo/sdk";
import { Math2 } from "@owlbear-rodeo/sdk";
import type { GridParsed } from "owlbear-utils";
import { assertItem, ORIGIN, unitsToCells } from "owlbear-utils";
import { METADATA_KEY_IS_AURA, METADATA_KEY_SCOPED_ID } from "../constants";
import { isAura, type Aura } from "../types/Aura";
import { getLayer } from "../types/AuraConfig";
import { getAuraShape } from "../types/AuraShape";
import type { CandidateSource } from "../types/CandidateSource";
import { getSourceSizePx } from "../types/CandidateSource";
import type { SceneMetadata } from "../types/metadata/SceneMetadata";
import type { AuraEntry } from "../types/metadata/SourceMetadata";
import { buildEffectAura } from "./effect";
import { buildImageAura } from "./image";
import { buildSimpleAura } from "./simple";

export function getAuraPosition(
    itemPosition: Vector2,
    offset?: Vector2,
    squareOffset?: Vector2,
) {
    return Math2.add(
        itemPosition,
        Math2.add(offset ?? ORIGIN, squareOffset ?? ORIGIN),
    );
}

/**
 * Helper to build an aura item.
 * @param item the source item that the aura radiates from.
 * @param style the aura style drawing params.
 * @param size the size of the aura in grid units. E.g size=10ft on a 5-foot grid creates a 2-square aura.
 */
export function buildAura(
    item: CandidateSource,
    entry: AuraEntry,
    sceneMetadata: SceneMetadata,
    grid: GridParsed,
): Aura {
    const shape = getAuraShape(entry, sceneMetadata, grid);
    const radius = unitsToCells(entry.size, grid);
    const absoluteItemSize = getSourceSizePx(item, grid);

    const aura =
        entry.style.type === "Simple"
            ? buildSimpleAura(
                  grid,
                  entry.style,
                  item.position,
                  entry.offset,
                  radius,
                  absoluteItemSize,
                  shape,
              )
            : entry.style.type === "Image"
            ? buildImageAura(
                  grid,
                  entry.style,
                  item.position,
                  entry.offset,
                  radius,
                  absoluteItemSize,
              )
            : buildEffectAura(
                  grid,
                  entry.style,
                  item.position,
                  entry.offset,
                  radius,
                  absoluteItemSize,
                  shape,
                  getLayer(entry),
              );

    aura.locked = true;
    aura.name = `Aura ${item.name} ${entry.size}`;
    aura.layer = getLayer(entry);
    aura.disableHit = true;
    aura.visible = item.visible;
    aura.attachedTo = item.id;
    aura.disableAttachmentBehavior = ["ROTATION", "LOCKED", "COPY"];
    aura.metadata[METADATA_KEY_IS_AURA] = true;
    aura.metadata[METADATA_KEY_SCOPED_ID] = entry.sourceScopedId;

    assertItem(aura, isAura);
    return aura;
}
