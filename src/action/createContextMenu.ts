import OBR, { Image } from "@owlbear-rodeo/sdk";
import add from "../../assets/add.svg";
import edit from "../../assets/edit.svg";

import {
    CONTEXTMENU_CREATE_ID,
    CONTEXTMENU_EDIT_ID,
    METADATA_KEY,
} from "../constants";
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
            return createAurasWithDefaults(context.items as Image[]); // Typecast OK because filter requires image
        },
    });
    const editAuraItemCreated = OBR.contextMenu.create({
        id: CONTEXTMENU_EDIT_ID,
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
    });
    return Promise.all([createAuraItemCreated, editAuraItemCreated]);
}
