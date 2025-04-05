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
import { Item } from "@owlbear-rodeo/sdk";
import { METADATA_KEY } from "../constants";
import { isCandidateSource } from "../types/CandidateSource";
import { isSource, updateEntry } from "../types/Source";
import { AuraEntryEditor } from "../ui/components/AuraEntryEditor";
import { CopyButton } from "../ui/components/CopyButton";
import PasteButton from "../ui/components/PasteButton";
import { useOwlbearStore } from "../useOwlbearStore";
import { usePlayerSettings } from "../usePlayerSettings";
import { createAurasWithDefaults } from "../utils/createAuras";
import { getId, hasId } from "../utils/itemUtils";
import { groupBy } from "../utils/jsUtils";
import { removeAura, removeAuras } from "../utils/removeAuras";
import { MenuItem } from "./Menuitem";

function AuraControls({ menuItem }: { menuItem: MenuItem }) {
    return (
        <Card sx={{ mb: 1 }}>
            <CardContent>
                <AuraEntryEditor
                    style={menuItem.aura.style}
                    setStyle={(style) =>
                        updateEntry(menuItem.toSpecifier(), (entry) => {
                            entry.style = style;
                        })
                    }
                    size={menuItem.aura.size}
                    setSize={(size) =>
                        updateEntry(menuItem.toSpecifier(), (entry) => {
                            entry.size = size;
                        })
                    }
                    visibleTo={menuItem.aura.visibleTo}
                    setVisibility={(visibleTo) =>
                        updateEntry(menuItem.toSpecifier(), (entry) => {
                            entry.visibleTo = visibleTo;
                        })
                    }
                />
            </CardContent>
            <CardActions>
                <Button
                    aria-label="remove"
                    startIcon={<DeleteIcon />}
                    onClick={() => removeAura(menuItem.toSpecifier())}
                >
                    Delete
                </Button>
                <CopyButton
                    size={menuItem.aura.size}
                    style={menuItem.aura.style}
                    visibleTo={menuItem.aura.visibleTo}
                />
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
                    }}
                >
                    New
                </Button>
                <PasteButton
                    sx={{
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        borderLeftWidth: 0,
                        borderRightWidth: 0,
                    }}
                />
                <Button
                    variant="outlined"
                    startIcon={<DeleteForeverIcon />}
                    color="error"
                    onClick={() => removeAuras(selectedItems.map(getId))}
                    sx={{
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                    }}
                >
                    Delete All
                </Button>
            </Stack>
        </>
    );
}
