import DeleteIcon from "@mui/icons-material/Delete";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import {
    Avatar,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    Stack,
    Typography,
} from "@mui/material";
import type { Item } from "@owlbear-rodeo/sdk";
import OBR from "@owlbear-rodeo/sdk";
import objectHash from "object-hash";
import { getId, getName, getOrInsert } from "owlbear-utils";
import { useMemo } from "react";
import { CHANNEL_MESSAGE, METADATA_KEY } from "../constants";
import { usePlayerStorage } from "../state/usePlayerStorage";
import type { AuraConfig } from "../types/AuraConfig";
import type { AuraEntry } from "../types/metadata/SourceMetadata";
import type { Source } from "../types/Source";
import { getSourceImage, isSource, updateEntries } from "../types/Source";
import { removeAllAuras, removeAuras } from "../utils/removeAuras";
import { AuraConfigEditor } from "./AuraConfigEditor";
import { CopyButton } from "./CopyButton";
import { NewAuraButton } from "./NewAuraButton";
import { PasteButton } from "./PasteButton";
import { SceneReadyGate } from "./SceneReadyGate";

/**
 * Info needed to render a source.
 */
interface SourceListItem {
    /**
     * Source ID
     */
    id: string;
    name: string;
    image?: string;
}

/**
 * Represents a single aura on a single source.
 */
interface AuraListItem extends SourceListItem {
    sourceScopedId: string;
}

function SourceChips({ auras }: { auras: AuraListItem[] }) {
    const sortedUniqueSources: SourceListItem[] = useMemo(() => {
        const ids = new Set();
        const sources = [];
        for (const aura of auras) {
            if (!ids.has(aura.id)) {
                ids.add(aura.id);
                sources.push(aura);
            }
        }
        return sources.sort(({ name: nameA }, { name: nameB }) =>
            nameA.localeCompare(nameB),
        );
    }, [auras]);
    return (
        <Stack
            direction={"row"}
            spacing={1}
            flexWrap={"wrap"}
            rowGap={1}
            sx={{ mb: 1 }}
        >
            {sortedUniqueSources.map(({ name, image, id }) => (
                <Chip
                    key={id}
                    avatar={
                        image !== undefined ? <Avatar src={image} /> : undefined
                    }
                    label={name}
                />
            ))}
        </Stack>
    );
}

function AuraControls({
    config,
    auras,
}: {
    config: AuraConfig;
    auras: AuraListItem[];
}) {
    return (
        <Card sx={{ mb: 1 }}>
            <CardContent>
                <SourceChips auras={auras} />
                <AuraConfigEditor
                    config={config}
                    setStyle={(style) =>
                        updateEntries(auras, (entry) => {
                            entry.style = style;
                        })
                    }
                    setSize={(size) =>
                        updateEntries(auras, (entry) => {
                            entry.size = size;
                        })
                    }
                    setVisibility={(visibleTo) =>
                        updateEntries(auras, (entry) => {
                            entry.visibleTo = visibleTo;
                        })
                    }
                    setLayer={(layer) =>
                        updateEntries(auras, (entry) => {
                            entry.layer = layer;
                        })
                    }
                />
            </CardContent>
            <CardActions>
                <Button
                    startIcon={<DeleteIcon />}
                    onClick={() => removeAuras(auras)}
                >
                    Delete
                </Button>
                <CopyButton config={config} />
            </CardActions>
        </Card>
    );
}

function deduplicationKey({ entry: config }: { entry: AuraConfig }): string {
    // don't just pass the object because it might have extra keys
    const configCopy: AuraConfig = {
        style: config.style,
        size: config.size,
        visibleTo: config.visibleTo,
        layer: config.layer,
    };
    return objectHash(configCopy);
}

interface AnnotatedAura extends Pick<Item, "name" | "id"> {
    image?: string;
    entry: AuraEntry;
}
function getAllAnnotatedAuras(source: Source): AnnotatedAura[] {
    return source.metadata[METADATA_KEY].auras.map((entry) => ({
        name: getName(source),
        id: source.id,
        image: getSourceImage(source),
        entry,
    }));
}

/**
 * Group auras by identicality. Each returned list is of identical auras.
 * No list will have two identical auras for the same item.
 */
function groupAuras(auras: AnnotatedAura[]): AnnotatedAura[][] {
    const m = new Map<string, AnnotatedAura[][]>();
    for (const aura of auras) {
        const hash = deduplicationKey(aura);
        const identicalityLists = getOrInsert(m, hash, () => []);
        // find the first list which doesn't have share an item with the current aura
        const firstAppendableList = identicalityLists.find(
            (list) => !list.some((otherAura) => otherAura.id === aura.id),
        );
        if (firstAppendableList) {
            firstAppendableList.push(aura);
        } else {
            identicalityLists.push([aura]);
        }
    }
    return [...m.values()].flat();
}

const ExtantAuras = ({ targetedItems }: { targetedItems: Item[] }) =>
    useMemo(() => {
        const editors = groupAuras(
            targetedItems.filter(isSource).flatMap(getAllAnnotatedAuras),
        )
            .sort((aurasA, aurasB) => aurasB.length - aurasA.length)
            .map((identicalAuras) => {
                const config: AuraConfig = identicalAuras[0].entry;
                const auras = identicalAuras.map(
                    ({ name, id, image, entry }) => ({
                        name,
                        image,
                        id,
                        sourceScopedId: entry.sourceScopedId,
                    }),
                );
                const reactKey = auras
                    .map(({ id, sourceScopedId }) => id + "/" + sourceScopedId)
                    .sort()
                    .join("|");
                return (
                    <AuraControls
                        key={reactKey}
                        config={config}
                        auras={auras}
                    />
                );
            });
        if (editors.length > 0) {
            return editors;
        } else {
            return (
                <Typography
                    sx={{ mb: 1 }}
                    color="textSecondary"
                    variant="subtitle2"
                >
                    No auras; click 'New' to add an aura.
                </Typography>
            );
        }
    }, [targetedItems]);

export function EditTab() {
    const playerSettingsSensible = usePlayerStorage(
        (store) => store.hasSensibleValues,
    );

    const lastNonemptySelection = usePlayerStorage(
        (store) => store.lastNonemptySelection,
    );
    const targetedItems = usePlayerStorage(
        (store) => store.lastNonemptySelectionItems,
    );

    const noSelection = targetedItems.length === 0;
    const header = noSelection
        ? "Select items to add or edit auras"
        : "Edit Auras";

    if (!playerSettingsSensible) {
        return null;
    }

    return (
        <>
            <Typography variant="h6" sx={{ mb: 2 }}>
                {header}
            </Typography>
            <SceneReadyGate>
                <ExtantAuras targetedItems={targetedItems} />
                <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="center"
                    flexWrap={"wrap"}
                    rowGap={1}
                >
                    <NewAuraButton
                        disabled={noSelection}
                        targetedItems={targetedItems}
                    />
                    <PasteButton
                        onPaste={(message) =>
                            OBR.broadcast.sendMessage(
                                CHANNEL_MESSAGE,
                                {
                                    ...message,
                                    sources: lastNonemptySelection,
                                },
                                {
                                    destination: "LOCAL",
                                },
                            )
                        }
                        disabled={noSelection}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<DeleteForeverIcon />}
                        color="error"
                        onClick={() => removeAllAuras(targetedItems.map(getId))}
                        disabled={noSelection}
                    >
                        Delete All
                    </Button>
                </Stack>
            </SceneReadyGate>
        </>
    );
}
