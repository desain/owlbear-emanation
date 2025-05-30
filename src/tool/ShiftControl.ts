import type { Billboard, ImageContent, ImageGrid } from "@owlbear-rodeo/sdk";
import OBR, {
    buildBillboard,
    isBillboard,
    type Item,
    type KeyFilter,
} from "@owlbear-rodeo/sdk";
import { assertItem, type HasParameterizedMetadata } from "owlbear-utils";
import moveBg from "../../assets/move-bg.svg";
import { METADATA_KEY_IS_CONTROL, METADATA_KEY_SCOPED_ID } from "../constants";
import { getAuraCenter, isAura, type Aura } from "../types/Aura";
import type { Specifier } from "../types/Specifier";
import type { IsAttached } from "../utils/itemUtils";

/**
 * Control for moving an aura around. Attached to the aura's source.
 */
export type ShiftControl = Billboard &
    IsAttached &
    HasParameterizedMetadata<typeof METADATA_KEY_IS_CONTROL, true> &
    HasParameterizedMetadata<typeof METADATA_KEY_SCOPED_ID, string>;
export function isShiftControl(item: Item): item is ShiftControl {
    return (
        isBillboard(item) &&
        item.attachedTo !== undefined &&
        METADATA_KEY_IS_CONTROL in item.metadata &&
        item.metadata[METADATA_KEY_IS_CONTROL] === true &&
        METADATA_KEY_SCOPED_ID in item.metadata &&
        typeof item.metadata[METADATA_KEY_SCOPED_ID] === "string"
    );
}
export const KEY_FILTER_SHIFT_CONTROL: KeyFilter[] = [
    {
        key: ["metadata", METADATA_KEY_IS_CONTROL],
        value: true,
    },
    {
        key: ["metadata", METADATA_KEY_SCOPED_ID],
        operator: "!=",
        value: undefined,
    },
];
export const KEY_FILTER_SHIFT_CONTROL_INVERSE: KeyFilter[] = [
    {
        key: ["metadata", METADATA_KEY_IS_CONTROL],
        operator: "!=",
        value: true,
    },
];

function auraToSpecifier(aura: Aura): Specifier {
    return {
        id: aura.attachedTo,
        sourceScopedId: aura.metadata[METADATA_KEY_SCOPED_ID],
    };
}

export function createShiftControl(aura: Aura): ShiftControl {
    const specifier = auraToSpecifier(aura);
    const size = 150;
    const imageContent = {
        url: window.location.origin + moveBg,
        mime: "image/svg+xml",
        width: 512,
        height: 512,
    } satisfies ImageContent;
    const imageGrid = {
        dpi: size,
        offset: { x: size / 2, y: size / 2 },
    } satisfies ImageGrid;
    const control = buildBillboard(imageContent, imageGrid)
        .name("Aura Control")
        .attachedTo(specifier.id)
        .disableAttachmentBehavior([
            "SCALE",
            "COPY",
            "LOCKED",
            "ROTATION",
            "VISIBLE",
        ])
        .position(getAuraCenter(aura))
        .metadata({
            [METADATA_KEY_IS_CONTROL]: true,
            [METADATA_KEY_SCOPED_ID]: specifier.sourceScopedId,
        })
        .layer("CONTROL")
        .scale({ x: 0.3, y: 0.3 })
        // .minViewScale(0.1)
        .maxViewScale(1)
        .locked(true)
        .build();
    assertItem(control, isShiftControl);
    return control;
}

/**
 * Class that manages making sure all auras have icons while it's installed.
 */
export class ShiftControlManager {
    #unsubscribe: VoidFunction = () => {
        void this;
    };
    #auraIdToControlId = new Map<string, string>();

    readonly install = async () => {
        await OBR.scene.local.getItems().then(this.#handleLocalItems);
        this.#unsubscribe = OBR.scene.local.onChange(this.#handleLocalItems);
    };
    readonly unininstall = async () => {
        this.#unsubscribe();
        this.#unsubscribe = () => {
            // nothing to do anymore
        };
        const toDelete = [...this.#auraIdToControlId.values()];
        this.#auraIdToControlId.clear();
        if (toDelete.length > 0) {
            await OBR.scene.local.deleteItems(toDelete);
        }
    };
    readonly #handleLocalItems = (items: Item[]) => {
        const nextMap = new Map<string, string>();
        const toAdd: Item[] = [];
        const toDelete = new Set(this.#auraIdToControlId.values());
        items.filter(isAura).forEach((aura) => {
            const controlId = this.#auraIdToControlId.get(aura.id);
            if (controlId) {
                nextMap.set(aura.id, controlId);
                toDelete.delete(controlId);
            } else {
                const control = createShiftControl(aura);
                toAdd.push(control);
                nextMap.set(aura.id, control.id);
            }
        });
        this.#auraIdToControlId = nextMap;
        if (toAdd.length > 0) {
            void OBR.scene.local.addItems(toAdd);
        }
        if (toDelete.size > 0) {
            void OBR.scene.local.deleteItems([...toDelete]);
        }
    };
}

export function shiftControlToSpecifier(shiftControl: ShiftControl): Specifier {
    return {
        id: shiftControl.attachedTo,
        sourceScopedId: shiftControl.metadata[METADATA_KEY_SCOPED_ID],
    };
}
