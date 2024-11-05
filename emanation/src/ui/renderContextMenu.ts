import OBR, { GridScale, Image, Item } from "@owlbear-rodeo/sdk";
import * as mdc from "material-components-web";
import 'material-components-web/dist/material-components-web.min.css';
import "../../assets/style.css";
import { METADATA_KEY } from "../constants";
import installTheme from "../installTheme";
import { getPlayerMetadata, PlayerMetadata } from '../metadata/PlayerMetadata';
import { EmanationEntry } from '../metadata/SourceMetadata';
import { createStyle, getColor, getOpacity } from '../types/EmanationStyle';
import { isSource, Source } from '../types/Source';
import { hexToRgb } from "../utils/colorUtils";
import { createEmanations, createEmanationsWithDefaults } from "../utils/createEmanations";
import { hasId } from '../utils/itemUtils';
import { createColorInput, installColorChangeHandler } from "./elements/colorInput";
import { createControlRow } from './elements/controlRow';
import { createNewEmanationButton, installNewEmanationHandler } from "./elements/newEmanationButton";
import { createOpacityInput, installOpacityChangeHandler } from "./elements/opacityInput";
import { createRemoveAllButton, installRemoveAllHandler } from "./elements/removeAllButton";
import { createRemoveEmanationButton, installRemoveEmanationHandler } from "./elements/removeEmanationButton";
import { createSizeInput, installSizeChangeHandler } from "./elements/sizeInput";
import { Specifier } from './elements/specifier';
import { createStyleSelect, installStyleChangeHandler } from './elements/styleSelect';

function groupBy<T, K extends keyof any>(ts: T[], key: (t: T) => K): Record<K, T[]> {
    return ts.reduce((acc, t) => {
        const k = key(t);
        if (acc[k]) {
            acc[k].push(t);
        } else {
            acc[k] = [t];
        }
        return acc;
    }, {} as Record<K, T[]>);
}

type MenuItem = {
    sourceId: string,
    aura: EmanationEntry,
}

function getSpecifier(menuItem: MenuItem): Specifier {
    return { sourceId: menuItem.sourceId, sourceScopedId: menuItem.aura.sourceScopedId };
}

async function getMenuitem(specifier: Specifier): Promise<MenuItem> {
    const [source] = await OBR.scene.items.getItems<Source>([specifier.sourceId]);
    return { sourceId: specifier.sourceId, aura: getEntry(source, specifier.sourceScopedId)!! };
}

function compareMenuItems(a: MenuItem, b: MenuItem) {
    return a.aura.size - b.aura.size;
}

function createControls(menuItem: MenuItem, scale: GridScale, playerMetadata: PlayerMetadata) {
    const specifier = getSpecifier(menuItem);
    const styleSizeRemove = createControlRow(
        createStyleSelect(specifier, menuItem.aura.style.type),
        createSizeInput(specifier, menuItem.aura.size, scale),
    );
    return styleSizeRemove
        + createControlRow(
            createColorInput(specifier, getColor(menuItem.aura.style, playerMetadata)),
            createOpacityInput(specifier, getOpacity(menuItem.aura.style, playerMetadata)),
            createRemoveEmanationButton(specifier),
        );
}

function getExtantEmanationHtml(
    networkItems: Item[],
    scale: GridScale,
    playerMetadata: PlayerMetadata,
    selection: string[],
): string[] {
    const onlyOneSelection = selection.length === 1;
    const selectedSources = networkItems.filter((item) => selection.includes(item.id)).filter(isSource);

    const menuItems: MenuItem[] = selectedSources
        .flatMap(source => source.metadata[METADATA_KEY].auras.map(aura => ({ sourceId: source.id, aura })));

    const menuItemsByAttachedTo = groupBy(menuItems, menuItem => menuItem.sourceId);

    return Object.keys(menuItemsByAttachedTo)
        .map((id) => ({ id, name: networkItems.find(hasId(id))!!.name }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .flatMap(({ id, name }) =>
            [
                ...onlyOneSelection ? [] : [`<h5 class="items-emanation-header">${name}</h5>`],
                ...menuItemsByAttachedTo[id]
                    .sort(compareMenuItems)
                    .map(menuItem => createControls(menuItem, scale, playerMetadata))
            ]
        );
}

function getEntry(source: Source, sourceScopedId: string): EmanationEntry | undefined {
    return source.metadata[METADATA_KEY].auras.find(aura => aura.sourceScopedId === sourceScopedId);
}

async function updateEntry(specifier: Specifier | null, updater: (aura: EmanationEntry) => void) {
    if (specifier === null) {
        return;
    }
    await OBR.scene.items.updateItems([specifier.sourceId], items => items.forEach(item => {
        if (isSource(item)) {
            const effectData = getEntry(item, specifier.sourceScopedId);
            if (effectData) {
                updater(effectData);
            }
        }
    }));
}

/**
 * This file represents the HTML of the popover that is shown once
 * the emanations context menu item is clicked.
 */

OBR.onReady(renderContextMenu);

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

    const extantEmanations = getExtantEmanationHtml(networkItems, scale, playerMetadata, selection ?? [])

    // Setup the document with an emanation size input and create button
    const app = document.getElementById('app')!;
    await installTheme(app, false);
    app.innerHTML = `
    ${extantEmanations.join('')}
    <div style="display: flex; justify-content: center">
      ${createNewEmanationButton()}
      ${createRemoveAllButton()}
    </div>
  `;

    installStyleChangeHandler(async (styleType, specifier) => {
        if (specifier === null) {
            return;
        }
        const menuItem = await getMenuitem(specifier);
        const playerMetadata = await getPlayerMetadata();
        const size = menuItem.aura.size;
        const color = getColor(menuItem.aura.style, playerMetadata);
        const opacity = getOpacity(menuItem.aura.style, playerMetadata);
        const source = await OBR.scene.items.getItems<Image>([menuItem.sourceId]);
        await createEmanations(source, size, createStyle(styleType, color, opacity));
        await removeEmanation(specifier);
        await renderContextMenu();
    });

    installColorChangeHandler(async (color, specifier) => {
        await updateEntry(specifier, entry => {
            if ('color' in entry.style) {
                entry.style.color = hexToRgb(color) ?? { x: 1, y: 0, z: 1 };
            } else if ('itemStyle' in entry.style) {
                entry.style.itemStyle.fillColor = color;
                entry.style.itemStyle.strokeColor = color;
            }
        });
    });

    installSizeChangeHandler(async (size, specifier) => {
        await updateEntry(specifier, effectData => {
            effectData.size = size;
        });
    });

    installOpacityChangeHandler(async (opacity, specifier) => {
        await updateEntry(specifier, effectData => {
            if ('opacity' in effectData.style) {
                effectData.style.opacity = opacity;
            } else if ('itemStyle' in effectData.style) {
                effectData.style.itemStyle.fillOpacity = opacity;
            }
        });
    });

    installNewEmanationHandler(async () => {
        const selection = await OBR.player.getSelection();
        const items = await OBR.scene.items.getItems<Image>(selection);
        await createEmanationsWithDefaults(items);
        renderContextMenu();
    });

    installRemoveEmanationHandler(async (specifier) => {
        await removeEmanation(specifier);
        await renderContextMenu();
    });
    installRemoveAllHandler(removeAllEmanations);

    mdc.autoInit();
}

async function removeEmanation(specifier: Specifier) {
    await OBR.scene.items.updateItems<Source>([specifier.sourceId], ([source]) => {
        source.metadata[METADATA_KEY].auras = source.metadata[METADATA_KEY].auras
            .filter((effectData) => effectData.sourceScopedId !== specifier.sourceScopedId);
        if (source.metadata[METADATA_KEY].auras.length === 0) {
            (source as Item).metadata[METADATA_KEY] = undefined;
        }
    });
}

async function removeAllEmanations() {
    const selection = await OBR.player.getSelection();
    if (!selection) {
        return;
    }
    await removeItemMetadata(selection);
    await renderContextMenu();
}

async function removeItemMetadata(ids: string[]) {
    await OBR.scene.items.updateItems(ids, (items) => items.forEach((item) => {
        item.metadata[METADATA_KEY] = undefined;
    }));
}