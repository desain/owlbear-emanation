import OBR from "@owlbear-rodeo/sdk";
import { assertItem } from "owlbear-utils";
import { isSource, Source } from "./Source";

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
    handler: (source: Source, sourceScopedId: string) => void,
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
