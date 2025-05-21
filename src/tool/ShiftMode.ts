import type {
    Item,
    ToolContext,
    ToolEvent,
    ToolMode,
    Vector2,
} from "@owlbear-rodeo/sdk";
import OBR, { Math2 } from "@owlbear-rodeo/sdk";
import { ORIGIN } from "owlbear-utils";
import edit from "../../assets/edit.svg";
import { getAuraPosition } from "../builders/buildAura";
import { ID_TOOL, ID_TOOL_MODE_SHIFT_AURA } from "../constants";
import { getAuraSquareOffset } from "../types/Aura";
import { updateEntries } from "../types/Source";
import { getAuraBySpecifier } from "../types/Specifier";
import {
    isShiftControl,
    KEY_FILTER_SHIFT_CONTROL,
    KEY_FILTER_SHIFT_CONTROL_INVERSE,
    ShiftControlManager,
    shiftControlToSpecifier,
} from "./ShiftControl";
import { deactivateTool } from "./tool";

export class ShiftMode implements ToolMode {
    readonly id = ID_TOOL_MODE_SHIFT_AURA;
    readonly icons = [
        {
            icon: edit,
            label: "Move Aura Center",
            filter: {
                activeTools: [ID_TOOL],
            },
        },
    ];
    readonly cursors = [
        {
            cursor: "grab",
            filter: {
                activeModes: [ID_TOOL_MODE_SHIFT_AURA],
                activeTools: [ID_TOOL],
                dragging: false,
                target: KEY_FILTER_SHIFT_CONTROL,
            },
        },
        {
            cursor: "grabbing",
            filter: {
                activeModes: [ID_TOOL_MODE_SHIFT_AURA],
                activeTools: [ID_TOOL],
                dragging: true,
                target: KEY_FILTER_SHIFT_CONTROL,
            },
        },
        {
            cursor: "move",
        },
    ];
    readonly preventDrag = {
        target: KEY_FILTER_SHIFT_CONTROL_INVERSE,
    };

    readonly #shiftControlManager = new ShiftControlManager();
    #dragState: null | {
        auraId: string;
        squareOffset: Vector2;
        originalPosition: Vector2;
    } = null;

    readonly onActivate = async () => {
        this.#dragState = null;
        await this.#shiftControlManager.install();
    };

    readonly onToolDoubleClick = (_context: ToolContext, event: ToolEvent) => {
        void this; // no instance-specific stuff
        if (event.target && isShiftControl(event.target)) {
            const controlId = event.target.id;
            void Promise.all([
                updateEntries(
                    [shiftControlToSpecifier(event.target)],
                    (entry) => {
                        delete entry.offset;
                    },
                ),
                OBR.scene.items
                    .getItems([event.target.attachedTo])
                    .then(([source]) => {
                        if (source) {
                            return OBR.scene.local.updateItems(
                                [controlId],
                                (items) =>
                                    items.forEach((item) => {
                                        item.position = source.position;
                                    }),
                            );
                        }
                        return null;
                    }),
            ]);
        }
        return false;
    };

    readonly onToolDragStart = async (
        _context: ToolContext,
        event: ToolEvent,
    ) => {
        if (event.target && isShiftControl(event.target)) {
            const aura = await getAuraBySpecifier(
                shiftControlToSpecifier(event.target),
            );
            if (!aura) {
                console.warn(`Shift control ${event.target.id} has no aura`);
                return;
            }
            this.#dragState = {
                auraId: aura.id,
                squareOffset: getAuraSquareOffset(aura),
                originalPosition: event.target.position,
            };
        }
    };

    readonly onToolDragMove = (_context: ToolContext, event: ToolEvent) => {
        void this.#handleDragMove(event.target, event.pointerPosition);
    };

    readonly #handleDragMove = async (
        target: Item | undefined,
        position: Vector2,
    ) => {
        if (target && isShiftControl(target) && this.#dragState) {
            const { squareOffset } = this.#dragState;
            await OBR.scene.local.updateItems(
                [target.id, this.#dragState.auraId],
                ([control, aura]) => {
                    if (control && aura) {
                        control.position = position;
                        aura.position = getAuraPosition(
                            position,
                            ORIGIN,
                            squareOffset,
                        );
                    }
                },
            );
        }
    };

    readonly onToolDragCancel = async (
        _context: ToolContext,
        event: ToolEvent,
    ) => {
        if (this.#dragState) {
            await this.#handleDragMove(
                event.target,
                this.#dragState.originalPosition,
            );
            this.#dragState = null;
        }
    };

    readonly onToolDragEnd = async (
        _context: ToolContext,
        event: ToolEvent,
    ) => {
        await this.#handleDragMove(event.target, event.pointerPosition);
        if (this.#dragState && event.target && isShiftControl(event.target)) {
            const [source] = await OBR.scene.items.getItems([
                event.target.attachedTo,
            ]);
            if (source) {
                const newOffset = Math2.subtract(
                    event.target.position,
                    source.position,
                );
                await updateEntries(
                    [shiftControlToSpecifier(event.target)],
                    (entry) => {
                        entry.offset = newOffset;
                    },
                );
            }
            this.#dragState = null;
        }
    };

    readonly onDeactivate = () => {
        this.#dragState = null;
        return Promise.all([
            this.#shiftControlManager.unininstall(),
            deactivateTool(),
        ]);
    };
}
