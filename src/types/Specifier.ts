import OBR from "@owlbear-rodeo/sdk";
import type { WritableDraft } from "immer";
import { assertItem } from "owlbear-utils";
import { METADATA_KEY_SCOPED_ID } from "../constants";
import type { Aura } from "./Aura";
import { isAura } from "./Aura";
import type { Source } from "./Source";
import { isSource } from "./Source";

/**
 * Way of specifying a specific aura.
 */
export interface Specifier {
    /**
     * ID of item that has the aura.
     */
    id: string;
    /**
     * Which item in the source's list of auras.
     */
    sourceScopedId: string;
}

export async function forEachSpecifier(
    specifiers: Specifier[],
    handler: (source: WritableDraft<Source>, sourceScopedId: string) => void,
) {
    const sources = specifiers.map((specifier) => specifier.id);
    return await OBR.scene.items.updateItems(sources, (items) =>
        items.forEach((source) => {
            assertItem(source, isSource);
            for (const specifier of specifiers) {
                if (specifier.id === source.id) {
                    handler(source, specifier.sourceScopedId);
                }
            }
        }),
    );
}

export async function getAuraBySpecifier(
    specifier: Specifier,
): Promise<Aura | undefined> {
    return (await OBR.scene.local.getItems(isAura)).find(
        (aura) =>
            aura.attachedTo === specifier.id &&
            aura.metadata[METADATA_KEY_SCOPED_ID] === specifier.sourceScopedId,
    );
}

/**
 * @returns Copy of the given specifier with all extra properties removed.
 */
export function trimSpecifier(specifier: Specifier): Specifier {
    return {
        id: specifier.id,
        sourceScopedId: specifier.sourceScopedId,
    };
}
