import { Image } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../constants";
import { Aura, IsAttached } from "../types/Aura";
import { getAuraShape } from "../types/AuraShape";
import { AuraStyle } from "../types/AuraStyle";
import { GridParsed } from "../types/GridParsed";
import { HasMetadata } from "../types/metadata/metadataUtils";
import { SceneMetadata } from "../types/metadata/SceneMetadata";
import { buildEffectAura } from "./buildEffectAura";
import { buildSimpleAura } from "./buildSimple";

/**
 * Helper to build an aura item.
 * @param item the source item that the aura radiates from.
 * @param style the aura style drawing params.
 * @param size the size of the aura in grid units. E.g size=10ft on a 5-foot grid creates a 2-square aura.
 */
export default function buildAura(
    item: Image,
    style: AuraStyle,
    size: number,
    sceneMetadata: SceneMetadata,
    grid: GridParsed,
): Aura {
    const shape = getAuraShape(grid, sceneMetadata);
    const numUnits = size / grid.parsedScale.multiplier;
    const gridUnitsPerItemGridUnit = grid.dpi / item.grid.dpi;
    const absoluteItemSize =
        Math.max(
            item.image.width * item.scale.x,
            item.image.height * item.scale.y,
        ) * gridUnitsPerItemGridUnit;

    const aura =
        style.type === "Simple"
            ? buildSimpleAura(
                  grid,
                  style,
                  item.position,
                  numUnits,
                  absoluteItemSize,
                  shape,
              )
            : buildEffectAura(
                  grid,
                  style,
                  item.position,
                  numUnits,
                  absoluteItemSize,
                  shape,
              );

    aura.locked = true;
    aura.name = `Aura ${item.name} ${size}`;
    aura.layer = "DRAWING";
    aura.disableHit = true;
    aura.visible = item.visible;
    aura.attachedTo = item.id;
    aura.disableAttachmentBehavior = ["ROTATION", "LOCKED", "COPY"];
    const metadata = { isAura: true } as const;
    aura.metadata[METADATA_KEY] = {
        ...(aura.metadata[METADATA_KEY] ?? {}),
        ...metadata,
    };

    return aura as typeof aura & IsAttached & HasMetadata<typeof metadata>; // typescript can't figure out these keys are set now;
}
