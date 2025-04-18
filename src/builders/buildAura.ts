import { GridParsed } from "owlbear-utils";
import { METADATA_KEY } from "../constants";
import { Aura, AuraMetadata, IsAttached } from "../types/Aura";
import { AuraConfig, getLayer } from "../types/AuraConfig";
import { getAuraShape } from "../types/AuraShape";
import { CandidateSource, getAbsoluteItemSize } from "../types/CandidateSource";
import { HasMetadata } from "../types/metadata/metadataUtils";
import { SceneMetadata } from "../types/metadata/SceneMetadata";
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
    const numUnits = config.size / grid.parsedScale.multiplier;
    const absoluteItemSize = getAbsoluteItemSize(item, grid);

    const aura =
        config.style.type === "Simple"
            ? buildSimpleAura(
                  grid,
                  config.style,
                  item.position,
                  numUnits,
                  absoluteItemSize,
                  shape,
              )
            : config.style.type === "Image"
            ? buildImageAura(
                  grid,
                  config.style,
                  item.position,
                  numUnits,
                  absoluteItemSize,
              )
            : buildEffectAura(
                  grid,
                  config.style,
                  item.position,
                  numUnits,
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
