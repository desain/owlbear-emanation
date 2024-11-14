import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { Button, Divider, IconButton, Skeleton, Stack } from "@mui/material";
import OBR, { Image, isImage, Item } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../constants";
import {
    AuraStyleType,
    createStyle,
    getColor,
    getOpacity,
    setColor,
    setOpacity,
} from "../types/AuraStyle";
import { GridParsed } from "../types/GridParsed";
import {
    getPlayerMetadata,
    PlayerMetadata,
} from "../types/metadata/PlayerMetadata";
import { isSource, updateEntry } from "../types/Source";
import { ColorInput } from "../ui/components/ColorInput";
import { Control } from "../ui/components/Control";
import { OpacitySlider } from "../ui/components/OpacitySlider";
import { SizeInput } from "../ui/components/SizeInput";
import { StyleSelector } from "../ui/components/StyleSelector";
import { useGrid, usePlayerMetadata, useSelection } from "../ui/hooks";
import { createAuras, createAurasWithDefaults } from "../utils/createAuras";
import { getId, hasId } from "../utils/itemUtils";
import { groupBy } from "../utils/jsUtils";
import { removeAura, removeAuras } from "../utils/removeAuras";
import { MenuItem } from "./Menuitem";

async function changeStyle(styleType: AuraStyleType, menuItem: MenuItem) {
    const playerMetadata = await getPlayerMetadata();
    const size = menuItem.aura.size;
    const color = getColor(menuItem.aura.style, playerMetadata);
    const opacity = getOpacity(menuItem.aura.style, playerMetadata);
    const source = await OBR.scene.items.getItems<Image>([menuItem.sourceId]);
    // Need to create before removing, since removing the last aura destroys the
    // context menu before we can create the new one.
    await createAuras(source, size, createStyle(styleType, color, opacity));
    await removeAura(menuItem.toSpecifier());
}

function TopControlRow({ children }: { children: React.ReactNode }) {
    return (
        <Stack direction="row" gap={1} sx={{ mb: 2 }}>
            {children}
        </Stack>
    );
}

function BottomControlRow({ children }: { children: React.ReactNode }) {
    return (
        <Stack direction="row" gap={1} sx={{ width: "100%" }}>
            {children}
        </Stack>
    );
}

function AuraDivider() {
    return <Divider sx={{ mt: 2, mb: 2 }} />;
}

function AuraControls({
    menuItem,
    grid,
    playerMetadata,
}: {
    menuItem: MenuItem;
    grid: GridParsed;
    playerMetadata: PlayerMetadata;
}) {
    return (
        <>
            <TopControlRow>
                <StyleSelector
                    fullWidth
                    value={menuItem.aura.style.type}
                    onChange={(styleType) => changeStyle(styleType, menuItem)}
                />
                <SizeInput
                    grid={grid}
                    value={menuItem.aura.size}
                    onChange={(size) =>
                        updateEntry(menuItem.toSpecifier(), (entry) => {
                            entry.size = size;
                        })
                    }
                />
            </TopControlRow>
            <BottomControlRow>
                <ColorInput
                    value={getColor(menuItem.aura.style, playerMetadata)}
                    onChange={(color) =>
                        updateEntry(menuItem.toSpecifier(), (entry) => {
                            setColor(entry.style, color);
                        })
                    }
                />
                <OpacitySlider
                    sx={{ flexGrow: 1 }}
                    value={getOpacity(menuItem.aura.style, playerMetadata)}
                    onChange={(opacity) =>
                        updateEntry(menuItem.toSpecifier(), (entry) => {
                            setOpacity(entry.style, opacity);
                        })
                    }
                />
                <Control label="Delete" sx={{ alignItems: "center" }}>
                    <IconButton
                        aria-label="remove"
                        onClick={() => removeAura(menuItem.toSpecifier())}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Control>
            </BottomControlRow>
            <AuraDivider />
        </>
    );
}

function ExtantAuras({
    selectedItems,
    grid,
    playerMetadata,
}: {
    selectedItems: Item[];
    grid: GridParsed;
    playerMetadata: PlayerMetadata;
}) {
    const onlyOneSelection = selectedItems.length === 1;
    const selectedSources = selectedItems.filter(isSource);

    const menuItems: MenuItem[] = selectedSources.flatMap((source) =>
        source.metadata[METADATA_KEY].auras.map(
            (aura) => new MenuItem(source.id, aura),
        ),
    );

    const menuItemsByAttachedTo = groupBy(
        menuItems,
        (menuItem) => menuItem.sourceId,
    );

    return Object.keys(menuItemsByAttachedTo)
        .map((id) => ({ id, name: selectedItems.find(hasId(id))!.name }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .flatMap(({ id, name }) => [
            onlyOneSelection ? null : <Divider key={id}>{name}</Divider>,
            ...menuItemsByAttachedTo[id]
                .sort(MenuItem.compare)
                .map((menuItem) => (
                    <AuraControls
                        key={menuItem.toKey()}
                        menuItem={menuItem}
                        grid={grid}
                        playerMetadata={playerMetadata}
                    />
                )),
        ]);
}

export function ContextMenu() {
    const playerMetadata = usePlayerMetadata();
    const grid = useGrid();
    const selectedItems = useSelection();

    if (
        grid === null ||
        playerMetadata === null ||
        selectedItems.length === 0
    ) {
        return <MenuSkeleton />;
    }

    return (
        <>
            <ExtantAuras
                selectedItems={selectedItems}
                grid={grid}
                playerMetadata={playerMetadata}
            />
            <Stack direction="row" justifyContent="center">
                <Button
                    variant="outlined"
                    startIcon={<AddCircleIcon />}
                    onClick={() =>
                        createAurasWithDefaults(
                            selectedItems.filter(isImage),
                            playerMetadata,
                        )
                    }
                    sx={{
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        borderRightColor: "gray",
                    }}
                >
                    New
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<DeleteForeverIcon />}
                    color="error"
                    onClick={() => removeAuras(selectedItems.map(getId))}
                    sx={{
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        borderLeftWidth: 0,
                    }}
                >
                    Delete All
                </Button>
            </Stack>
        </>
    );
}

// taken from https://github.com/owlbear-rodeo/weather/blob/main/src/menu/Menu.tsx
function FormControlSkeleton({ width = "100%" }: { width?: string | number }) {
    return (
        <Stack width={width} gap={0.5}>
            <Skeleton height={17.25} width={40} />
            <Skeleton variant="rounded" height={40} width={width} />
        </Stack>
    );
}

function MenuSkeleton() {
    return (
        <>
            <TopControlRow>
                <FormControlSkeleton />
                <FormControlSkeleton />
            </TopControlRow>
            <BottomControlRow>
                <FormControlSkeleton width={40} />
                <FormControlSkeleton />
                <FormControlSkeleton width={40} />
            </BottomControlRow>
            <AuraDivider />
            <Stack direction="row" justifyContent="center">
                <Skeleton>
                    <Button startIcon={<AddCircleIcon />}>New</Button>
                    <Button startIcon={<DeleteForeverIcon />}>
                        Delete All
                    </Button>
                </Skeleton>
            </Stack>
        </>
    );
}
