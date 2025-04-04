import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import {
    Button,
    Card,
    CardActions,
    CardContent,
    Divider,
    Stack,
} from "@mui/material";
import OBR, { Image, Item } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../constants";
import {
    AuraStyleType,
    createStyle,
    getBlendMode,
    getColor,
    getOpacity,
    isColorOpacityShaderStyle,
    isEffectStyle,
    isSimpleStyle,
    setColor,
    setOpacity,
} from "../types/AuraStyle";
import { isCandidateSource } from "../types/CandidateSource";
import { isSource, updateEntry } from "../types/Source";
import { BlendModeSelector } from "../ui/components/BlendModeSelector";
import { ColorInput } from "../ui/components/ColorInput";
import { OpacitySlider } from "../ui/components/OpacitySlider";
import { SizeInput } from "../ui/components/SizeInput";
import { StyleSelector } from "../ui/components/StyleSelector";
import { VisibilitySelector } from "../ui/components/VisibilitySelector";
import { useOwlbearStore } from "../useOwlbearStore";
import { usePlayerSettings } from "../usePlayerSettings";
import { createAuras, createAurasWithDefaults } from "../utils/createAuras";
import { getId, hasId } from "../utils/itemUtils";
import { groupBy } from "../utils/jsUtils";
import { removeAura, removeAuras } from "../utils/removeAuras";
import { MenuItem } from "./Menuitem";

async function changeStyle(styleType: AuraStyleType, menuItem: MenuItem) {
    const visibleTo = menuItem.aura.visibleTo;
    const size = menuItem.aura.size;
    const color = getColor(menuItem.aura.style);
    const opacity = getOpacity(menuItem.aura.style);
    const blendMode = getBlendMode(menuItem.aura.style);
    const source = await OBR.scene.items.getItems<Image>([menuItem.sourceId]);
    await createAuras(
        source,
        size,
        createStyle(styleType, color, opacity, blendMode),
        visibleTo,
    );
    await removeAura(menuItem.toSpecifier());
}

function AuraControls({ menuItem }: { menuItem: MenuItem }) {
    const hasColorOpacityControls =
        isSimpleStyle(menuItem.aura.style) ||
        isColorOpacityShaderStyle(menuItem.aura.style);

    return (
        <Card sx={{ mb: 1 }}>
            <CardContent>
                <Stack direction="row" gap={1} sx={{ mb: 2 }}>
                    <StyleSelector
                        fullWidth
                        value={menuItem.aura.style.type}
                        onChange={(styleType) =>
                            changeStyle(styleType, menuItem)
                        }
                    />
                    <SizeInput
                        value={menuItem.aura.size}
                        onChange={(size) =>
                            updateEntry(menuItem.toSpecifier(), (entry) => {
                                entry.size = size;
                            })
                        }
                    />
                </Stack>
                {hasColorOpacityControls && (
                    <Stack
                        direction="row"
                        gap={1}
                        sx={{ width: "100%", mb: 2 }}
                    >
                        <ColorInput
                            value={getColor(menuItem.aura.style)}
                            onChange={(color) =>
                                updateEntry(menuItem.toSpecifier(), (entry) => {
                                    setColor(entry.style, color);
                                })
                            }
                        />
                        <OpacitySlider
                            sx={{ flexGrow: 1 }}
                            value={getOpacity(menuItem.aura.style)}
                            onChange={(opacity) =>
                                updateEntry(menuItem.toSpecifier(), (entry) => {
                                    setOpacity(entry.style, opacity);
                                })
                            }
                        />
                    </Stack>
                )}
                <details>
                    <summary>Advanced Options</summary>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                        <VisibilitySelector
                            fullWidth
                            value={menuItem.aura.visibleTo}
                            onChange={(visibleTo) =>
                                updateEntry(menuItem.toSpecifier(), (entry) => {
                                    entry.visibleTo = visibleTo;
                                })
                            }
                        />
                        {isEffectStyle(menuItem.aura.style) && (
                            <BlendModeSelector
                                fullWidth
                                value={getBlendMode(menuItem.aura.style)}
                                onChange={(blendMode) =>
                                    updateEntry(
                                        menuItem.toSpecifier(),
                                        (entry) => {
                                            if (isEffectStyle(entry.style)) {
                                                entry.style.blendMode =
                                                    blendMode;
                                            }
                                        },
                                    )
                                }
                            />
                        )}
                    </Stack>
                </details>
            </CardContent>
            <CardActions>
                <Button
                    aria-label="remove"
                    startIcon={<DeleteIcon />}
                    onClick={() => removeAura(menuItem.toSpecifier())}
                >
                    Delete
                </Button>
            </CardActions>
        </Card>
    );
}

function ExtantAuras({ selectedItems }: { selectedItems: Item[] }) {
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
        .sort((a, b) => a.id.localeCompare(b.id))
        .flatMap(({ id, name }) => [
            onlyOneSelection ? null : <Divider key={id}>{name}</Divider>,
            ...menuItemsByAttachedTo[id]
                .sort(MenuItem.compare)
                .map((menuItem) => (
                    <AuraControls key={menuItem.toKey()} menuItem={menuItem} />
                )),
        ]);
}

export function EditTab() {
    const playerSettingsSensible = usePlayerSettings(
        (store) => store.hasSensibleValues,
    );
    const selectedItems = useOwlbearStore((store) => store.selectedItems);

    if (selectedItems.length === 0) {
        return <p>Select items to add or edit auras</p>;
    }

    if (!playerSettingsSensible) {
        return null;
    }

    return (
        <>
            <h4>Edit Auras</h4>
            <ExtantAuras selectedItems={selectedItems} />
            <Stack direction="row" justifyContent="center">
                <Button
                    variant="outlined"
                    startIcon={<AddCircleIcon />}
                    onClick={() =>
                        createAurasWithDefaults(
                            selectedItems.filter(isCandidateSource),
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
