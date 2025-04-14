import AddCircleIcon from "@mui/icons-material/AddCircle";
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
import OBR, { Item } from "@owlbear-rodeo/sdk";
import objectHash from "object-hash";
import { groupBy } from "owlbear-utils";
import React, { useMemo } from "react";
import { MESSAGE_CHANNEL, METADATA_KEY } from "../constants";
import { AuraConfig } from "../types/AuraConfig";
import { isCandidateSource } from "../types/CandidateSource";
import {
    getSourceImage,
    getSourceName,
    isSource,
    Source,
    updateEntries,
} from "../types/Source";
import { useOwlbearStore } from "../useOwlbearStore";
import { usePlayerSettings } from "../usePlayerSettings";
import { createAurasWithDefaults } from "../utils/createAuras";
import { getId } from "owlbear-utils";
import { removeAllAuras, removeAuras } from "../utils/removeAuras";
import { AuraConfigEditor } from "./AuraConfigEditor";
import { CopyButton } from "./CopyButton";
import { PasteButton } from "./PasteButton";
import { SceneReadyGate } from "./SceneReadyGate";

/**
 * Info needed to render a source.
 */
interface SourceListItem {
    name: string;
    image?: string;
    sourceId: string;
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
            if (!ids.has(aura.sourceId)) {
                ids.add(aura.sourceId);
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
            {sortedUniqueSources.map(({ name, image, sourceId }) => (
                <Chip
                    key={sourceId}
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
                    aria-label="remove"
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
    };
    return objectHash(configCopy);
}

function getAllAnnotatedAuras(source: Source) {
    return source.metadata[METADATA_KEY].auras.map((entry) => ({
        name: getSourceName(source),
        image: getSourceImage(source),
        sourceId: source.id,
        entry,
    }));
}

function ExtantAuras({
    targetedItems,
}: {
    targetedItems: Item[];
}): React.ReactNode {
    return useMemo(
        () =>
            Object.values(
                groupBy(
                    targetedItems
                        .filter(isSource)
                        .flatMap(getAllAnnotatedAuras),
                    deduplicationKey,
                ),
            )
                .sort((aurasA, aurasB) => aurasB.length - aurasA.length)
                .map((identicalAuras) => {
                    const config: AuraConfig = identicalAuras[0].entry;
                    const auras = identicalAuras.map(
                        ({ name, image, sourceId, entry }) => ({
                            name,
                            image,
                            sourceId,
                            sourceScopedId: entry.sourceScopedId,
                        }),
                    );
                    const reactKey = auras
                        .map(({ sourceScopedId }) => sourceScopedId)
                        .sort()
                        .join("|");
                    return (
                        <AuraControls
                            key={reactKey}
                            config={config}
                            auras={auras}
                        />
                    );
                }),
        [targetedItems],
    );
}

export function EditTab() {
    const playerSettingsSensible = usePlayerSettings(
        (store) => store.hasSensibleValues,
    );

    const targetedItems = useOwlbearStore(
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
                    <Button
                        variant="outlined"
                        startIcon={<AddCircleIcon />}
                        onClick={() =>
                            createAurasWithDefaults(
                                targetedItems.filter(isCandidateSource),
                            )
                        }
                        disabled={noSelection}
                    >
                        New
                    </Button>
                    <PasteButton
                        onPaste={async (message) => {
                            await OBR.broadcast.sendMessage(
                                MESSAGE_CHANNEL,
                                {
                                    ...message,
                                    sources: await OBR.player.getSelection(),
                                },
                                {
                                    destination: "LOCAL",
                                },
                            );
                        }}
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
