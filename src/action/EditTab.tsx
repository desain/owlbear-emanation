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
import React from "react";
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
import { getId } from "../utils/itemUtils";
import { groupBy } from "../utils/jsUtils";
import { removeAllAuras, removeAuras } from "../utils/removeAuras";
import { AuraConfigEditor } from "./AuraConfigEditor";
import { CopyButton } from "./CopyButton";
import { PasteButton } from "./PasteButton";

/**
 * Represents a single aura on a single source.
 */
interface AuraListItem {
    name: string;
    image?: string;
    sourceId: string;
    sourceScopedId: string;
}

function SourceChips({ auras }: { auras: AuraListItem[] }) {
    const sortedAuras = auras.sort(({ name: nameA }, { name: nameB }) =>
        nameA.localeCompare(nameB),
    );
    return (
        <Stack
            direction={"row"}
            spacing={1}
            sx={{ mb: 1, flexWrap: "wrap", rowGap: 1 }}
        >
            {sortedAuras.map(({ name, image, sourceId }) => (
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

function deduplicationKey(config: AuraConfig): string {
    // don't just pass the object because it might have extra keys
    const configCopy: AuraConfig = {
        style: config.style,
        size: config.size,
        visibleTo: config.visibleTo,
    };
    return objectHash(configCopy);
}

function ExtantAuras({
    selectedItems,
}: {
    selectedItems: Item[];
}): React.ReactNode {
    const selectedSources = selectedItems.filter(isSource);

    const getAllAnnotatedAuras = (source: Source) =>
        source.metadata[METADATA_KEY].auras.map((entry) => ({
            name: getSourceName(source),
            image: getSourceImage(source),
            sourceId: source.id,
            entry,
        }));
    const getDeduplicationKey = ({ entry }: { entry: AuraConfig }) =>
        deduplicationKey(entry);

    return Object.values(
        groupBy(
            selectedSources.flatMap(getAllAnnotatedAuras),
            getDeduplicationKey,
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
                <AuraControls key={reactKey} config={config} auras={auras} />
            );
        });
}

export function EditTab() {
    const playerSettingsSensible = usePlayerSettings(
        (store) => store.hasSensibleValues,
    );
    const selectedItems = useOwlbearStore((store) => store.selectedItems);

    const noSelection = selectedItems.length === 0;

    if (!playerSettingsSensible) {
        return null;
    }

    return (
        <>
            <Typography variant="h6" sx={{ mb: 2 }}>
                {noSelection
                    ? "Select items to add or edit auras"
                    : "Edit Auras"}
            </Typography>
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
                    disabled={noSelection}
                    sx={{
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                    }}
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
                    onClick={() => removeAllAuras(selectedItems.map(getId))}
                    disabled={noSelection}
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
