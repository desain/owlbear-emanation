import OBR from "@owlbear-rodeo/sdk";
import add from "../../assets/add.svg";
import edit from "../../assets/edit.svg";

import {
    CONTEXTMENU_CREATE_ID,
    CONTEXTMENU_EDIT_ID,
    METADATA_KEY,
    TAB_CHANNEL,
} from "../constants";
import { CandidateSource } from "../types/CandidateSource";
import { useOwlbearStore } from "../useOwlbearStore";
import { createAurasWithDefaults } from "../utils/createAuras";

/**
 * Creates context menu - but should be called from background or action.
 */
export default async function createContextMenu() {
    const createAuraItemCreated = OBR.contextMenu.create({
        id: CONTEXTMENU_CREATE_ID,
        shortcut: "E", // Emanation
        icons: [
            {
                icon: add,
                label: "Add Aura",
                filter: {
                    every: [
                        { key: "type", value: "IMAGE", coordinator: "||" },
                        { key: "layer", value: "CHARACTER" },
                        { key: ["metadata", METADATA_KEY], value: undefined },
                    ],
                    permissions: ["UPDATE"],
                },
            },
            {
                icon: add,
                label: "Add Aura",
                filter: {
                    every: [
                        { key: "type", value: "SHAPE" },
                        { key: "shapeType", value: "CIRCLE" },
                        { key: ["metadata", METADATA_KEY], value: undefined },
                    ],
                    permissions: ["UPDATE"],
                },
            },
        ],
        async onClick(context) {
            return createAurasWithDefaults(context.items as CandidateSource[]); // Typecast OK because filter checks type
        },
    });
    const editAuraItemCreated = OBR.contextMenu.create({
        id: CONTEXTMENU_EDIT_ID,
        shortcut: "E", // Edit Emanation
        icons: [
            {
                icon: edit,
                label: "Edit Auras",
                filter: {
                    every: [
                        { key: "type", value: "IMAGE" },
                        { key: "layer", value: "CHARACTER" },
                    ],
                    some: [
                        {
                            key: ["metadata", METADATA_KEY],
                            operator: "!=",
                            value: undefined,
                        },
                    ],
                    permissions: ["UPDATE"],
                },
            },
            {
                icon: edit,
                label: "Edit Auras",
                filter: {
                    every: [
                        { key: "type", value: "SHAPE" },
                        { key: "shapeType", value: "CIRCLE" },
                    ],
                    some: [
                        {
                            key: ["metadata", METADATA_KEY],
                            operator: "!=",
                            value: undefined,
                        },
                    ],
                    permissions: ["UPDATE"],
                },
            },
        ],
        async onClick() {
            const selection = await OBR.player.getSelection();
            await useOwlbearStore.getState().setEditMenuClickedItems(selection);
            if (await OBR.action.isOpen()) {
                await OBR.broadcast.sendMessage(TAB_CHANNEL, 0, {
                    destination: "LOCAL",
                });
            } else {
                return OBR.action.open();
            }
        },
    });
    return Promise.all([createAuraItemCreated, editAuraItemCreated]);
}
