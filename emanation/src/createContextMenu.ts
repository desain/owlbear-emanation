import OBR, { Image } from '@owlbear-rodeo/sdk';
import add from "../assets/add.svg";
import edit from "../assets/edit.svg";

import { CONTEXTMENU_CREATE_ID, CONTEXTMENU_EDIT_ID, METADATA_KEY } from "./constants";
import { createEmanationsWithDefaults } from "./utils/createEmanations";

export default function createContextMenu() {
    OBR.contextMenu.create({
        id: CONTEXTMENU_CREATE_ID,
        shortcut: 'E',
        icons: [{
            icon: add,
            label: "Add Aura",
            filter: {
                every: [
                    { key: "type", value: "IMAGE" },
                    { key: "layer", value: "CHARACTER" },
                    { key: ['metadata', METADATA_KEY], value: undefined }
                ],
                permissions: ["UPDATE"],
            },
        }],
        async onClick(context, _) {
            await createEmanationsWithDefaults(context.items as Image[]); // Typecast OK because filter requires image
        },
    });
    OBR.contextMenu.create({
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
                        { key: ['metadata', METADATA_KEY], operator: '!=', value: undefined },
                    ],
                    permissions: ["UPDATE"],
                },
            },
        ],
        embed: {
            url: "/emanation/contextmenu.html",
            height: 200,
        },
    });
}