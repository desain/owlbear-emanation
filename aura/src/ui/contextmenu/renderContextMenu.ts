/**
 * This file represents the HTML of the popover that is shown once
 * the auras context menu item is clicked.
 */

import OBR, { GridScale, Image, Item } from "@owlbear-rodeo/sdk";
import * as mdc from "material-components-web";
import 'material-components-web/dist/material-components-web.min.css';
import "../../../assets/style.css";
import { METADATA_KEY } from "../../constants";
import installTheme from "../../installTheme";
import { createStyle, getColor, getOpacity, setColor, setOpacity } from '../../types/AuraStyle';
import { getPlayerMetadata, PlayerMetadata } from '../../types/metadata/PlayerMetadata';
import { isSource, updateEntry } from '../../types/Source';
import { createAuras, createAurasWithDefaults } from "../../utils/createAuras";
import { hasId } from '../../utils/itemUtils';
import { groupBy } from '../../utils/jsUtils';
import { removeAura, removeAuras } from '../../utils/removeAuras';
import { createColorInput, installColorChangeHandler } from "../elements/colorInput";
import { createControlRow } from '../elements/controlRow';
import { createNewAuraButton, installNewAuraHandler } from "../elements/newAuraButton";
import { createOpacityInput, installOpacityChangeHandler } from "../elements/opacityInput";
import { createRemoveAllButton, installRemoveAllHandler } from "../elements/removeAllButton";
import { createRemoveAuraButton, installRemoveAuraHandler } from "../elements/removeAuraButton";
import { createSizeInput, installSizeChangeHandler } from "../elements/sizeInput";
import { createStyleSelect, installStyleChangeHandler } from '../elements/styleSelect';
import { MenuItem } from './Menuitem';

function createControls(menuItem: MenuItem, scale: GridScale, playerMetadata: PlayerMetadata) {
    const specifier = menuItem.toSpecifier();
    const styleSizeRemove = createControlRow(
        createStyleSelect(specifier, menuItem.aura.style.type),
        createSizeInput(specifier, menuItem.aura.size, scale),
    );
    return styleSizeRemove
        + createControlRow(
            createColorInput(specifier, getColor(menuItem.aura.style, playerMetadata)),
            createOpacityInput(specifier, getOpacity(menuItem.aura.style, playerMetadata)),
            createRemoveAuraButton(specifier),
        );
}

function getExtantAuraHtml(
    networkItems: Item[],
    scale: GridScale,
    playerMetadata: PlayerMetadata,
    selection: string[],
): string {
    const onlyOneSelection = selection.length === 1;
    const selectedSources = networkItems.filter((item) => selection.includes(item.id)).filter(isSource);

    const menuItems: MenuItem[] = selectedSources
        .flatMap(source => source.metadata[METADATA_KEY].auras
            .map(aura => new MenuItem(source.id, aura)));

    const menuItemsByAttachedTo = groupBy(menuItems, menuItem => menuItem.sourceId);

    return Object.keys(menuItemsByAttachedTo)
        .map(id => ({ id, name: networkItems.find(hasId(id))!!.name }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .flatMap(({ id, name }) =>
            [
                ...onlyOneSelection ? [] : [`<h5 class="items-aura-header">${name}</h5>`],
                ...menuItemsByAttachedTo[id]
                    .sort(MenuItem.compare)
                    .map(menuItem => createControls(menuItem, scale, playerMetadata))
            ]
        )
        .join('');
}

async function renderContextMenu() {
    const [
        networkItems,
        scale,
        selection,
        playerMetadata
    ] = await Promise.all([
        OBR.scene.items.getItems(),
        OBR.scene.grid.getScale(),
        OBR.player.getSelection(),
        getPlayerMetadata(),
    ]);

    const extantAuras = getExtantAuraHtml(networkItems, scale, playerMetadata, selection ?? []);

    // Setup the document with an aura size input and create button
    const app = document.getElementById('app')!;
    await installTheme(app, false);
    app.innerHTML = `
        ${extantAuras}
        <div style="display: flex; justify-content: center">
            ${createNewAuraButton()}
            ${createRemoveAllButton()}
        </div>
    `;

    installStyleChangeHandler(async (styleType, specifier) => {
        if (specifier === null) {
            return;
        }
        const menuItem = await MenuItem.fromSpecifier(specifier);
        const playerMetadata = await getPlayerMetadata();
        const size = menuItem.aura.size;
        const color = getColor(menuItem.aura.style, playerMetadata);
        const opacity = getOpacity(menuItem.aura.style, playerMetadata);
        const source = await OBR.scene.items.getItems<Image>([menuItem.sourceId]);
        // Need to create before removing, since removing the last aura destroys the
        // context menu before we can create the new one.
        await createAuras(source, size, createStyle(styleType, color, opacity));
        await removeAura(specifier);
        await renderContextMenu();
    });

    installColorChangeHandler((color, specifier) => {
        return updateEntry(specifier, entry => {
            setColor(entry.style, color);
        });
    });

    installSizeChangeHandler((size, specifier) => {
        return updateEntry(specifier, entry => {
            entry.size = size;
        });
    });

    installOpacityChangeHandler((opacity, specifier) => {
        return updateEntry(specifier, entry => {
            setOpacity(entry.style, opacity);
        });
    });

    installNewAuraHandler(async () => {
        const selection = await OBR.player.getSelection();
        const items = await OBR.scene.items.getItems<Image>(selection);
        await createAurasWithDefaults(items);
        return renderContextMenu();
    });

    installRemoveAuraHandler(async (specifier) => {
        await removeAura(specifier);
        return renderContextMenu();
    });

    installRemoveAllHandler(async () => {
        const selection = await OBR.player.getSelection() ?? [];
        await removeAuras(selection);
        return renderContextMenu();
    });

    mdc.autoInit();
}

OBR.onReady(renderContextMenu);