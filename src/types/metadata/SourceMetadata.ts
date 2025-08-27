import { type Item, type Shape } from "@owlbear-rodeo/sdk";
import { isObject, ORIGIN, units, WHITE_HEX } from "owlbear-utils";
import { METADATA_KEY } from "../../constants";
import type { AuraConfig } from "../AuraConfig";
import { isAuraConfig } from "../AuraConfig";
import type { Source } from "../Source";

/**
 * Metadata for each aura.
 */
export interface AuraEntry extends AuraConfig {
    /**
     * Id which uniquely identifies the aura in the owning source's list of auras.
     * Two sources may have auras with the same scoped id if they are created by duplicating
     * a source that already has an aura.
     */
    sourceScopedId: string;
}
function isAuraEntry(entry: unknown): entry is AuraEntry {
    return (
        isAuraConfig(entry) &&
        "sourceScopedId" in entry &&
        typeof entry.sourceScopedId === "string"
    );
}

/**
 * Metadata on an aura source.
 */
export interface SourceMetadata {
    auras: AuraEntry[];
}
export function isSourceMetadata(
    metadata: unknown,
): metadata is SourceMetadata {
    return (
        isObject(metadata) &&
        "auras" in metadata &&
        Array.isArray(metadata.auras) &&
        metadata.auras.every(isAuraEntry)
    );
}

export function addEntry(item: Item, config: AuraConfig) {
    const metadata: SourceMetadata = isSourceMetadata(
        item.metadata[METADATA_KEY],
    )
        ? item.metadata[METADATA_KEY]
        : {
              auras: [],
          };

    const entry = {
        size: config.size,
        style: config.style,
        visibleTo: config.visibleTo,
        layer: config.layer,
        // no offset
        shapeOverride: config.shapeOverride,
        sourceScopedId: crypto.randomUUID(),
    } satisfies AuraEntry;
    metadata.auras.push(entry);
    item.metadata[METADATA_KEY] = metadata;
}

export function removeEntry(source: Source, sourceScopedId: string) {
    source.metadata[METADATA_KEY].auras = source.metadata[
        METADATA_KEY
    ].auras.filter((entry) => entry.sourceScopedId !== sourceScopedId);
}

if (import.meta.vitest) {
    const { describe, it, expect } = import.meta.vitest;

    describe(addEntry, () => {
        it("Copies over config values except offset", () => {
            const config = {
                size: units(5),
                style: {
                    type: "Spirits",
                },
                layer: "DRAWING",
                offset: { x: 1, y: 1 },
                shapeOverride: "square",
                visibleTo: null,
            } satisfies AuraConfig;
            const item = {
                createdUserId: "",
                height: 5,
                id: "",
                lastModified: "",
                lastModifiedUserId: "",
                layer: "DRAWING",
                locked: false,
                metadata: {},
                name: "",
                position: ORIGIN,
                rotation: 0,
                scale: { x: 1, y: 1 },
                shapeType: "CIRCLE",
                style: {
                    fillColor: WHITE_HEX,
                    fillOpacity: 1,
                    strokeColor: WHITE_HEX,
                    strokeOpacity: 1,
                    strokeDash: [],
                    strokeWidth: 10,
                },
                type: "SHAPE",
                visible: true,
                width: 5,
                zIndex: 0,
            } satisfies Shape;

            addEntry(item, config);

            const actualConfig = (item as unknown as Source).metadata[
                METADATA_KEY
            ].auras[0];
            expect(actualConfig?.size).toBe(config.size);
            expect(actualConfig?.style).toEqual(config.style);
            expect(actualConfig?.visibleTo).toBe(config.visibleTo);
            expect(actualConfig?.layer).toBe(config.layer);
            expect(actualConfig?.shapeOverride).toBe(config.shapeOverride);
            expect(actualConfig?.offset?.x).toBeUndefined();
            expect(actualConfig?.offset?.y).toBeUndefined();
        });
    });
}
