import type { GridParsed } from "owlbear-utils";
import { unitsToCells } from "owlbear-utils";
import { METADATA_KEY } from "../constants";
import type { Aura, AuraMetadata, IsAttached } from "../types/Aura";
import type { AuraConfig } from "../types/AuraConfig";
import { getLayer } from "../types/AuraConfig";
import { getAuraShape } from "../types/AuraShape";
import type { CandidateSource } from "../types/CandidateSource";
import { getSourceSizePx } from "../types/CandidateSource";
import type { HasMetadata } from "../types/metadata/metadataUtils";
import type { SceneMetadata } from "../types/metadata/SceneMetadata";
import { buildEffectAura } from "./effect";
import { buildImageAura } from "./image";
import { buildSimpleAura } from "./simple";

/**
 * Helper to build an aura item.
 * @param item the source item that the aura radiates from.
 * @param style the aura style drawing params.
 * @param size the size of the aura in grid units. E.g size=10ft on a 5-foot grid creates a 2-square aura.
 */
export default function buildAura(
    item: CandidateSource,
    config: AuraConfig,
    sceneMetadata: SceneMetadata,
    grid: GridParsed,
): Aura {
    const shape = getAuraShape(grid, sceneMetadata);
    const radius = unitsToCells(config.size, grid);
    const absoluteItemSize = getSourceSizePx(item, grid);

    const aura =
        config.style.type === "Simple"
            ? buildSimpleAura(
                  grid,
                  config.style,
                  item.position,
                  radius,
                  absoluteItemSize,
                  shape,
              )
            : config.style.type === "Image"
            ? buildImageAura(
                  grid,
                  config.style,
                  item.position,
                  radius,
                  absoluteItemSize,
              )
            : buildEffectAura(
                  grid,
                  config.style,
                  item.position,
                  radius,
                  absoluteItemSize,
                  shape,
              );

    aura.locked = true;
    aura.name = `Aura ${item.name} ${config.size}`;
    aura.layer = getLayer(config);
    aura.disableHit = true;
    aura.visible = item.visible;
    aura.attachedTo = item.id;
    aura.disableAttachmentBehavior = ["ROTATION", "LOCKED", "COPY"];
    const metadata = { isAura: true } satisfies AuraMetadata;
    aura.metadata[METADATA_KEY] = {
        ...(aura.metadata[METADATA_KEY] ?? {}),
        ...metadata,
    };

    return aura as typeof aura & IsAttached & HasMetadata<typeof metadata>; // typescript can't figure out these keys are set now;
}
