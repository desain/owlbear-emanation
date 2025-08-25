import AddCircleIcon from "@mui/icons-material/AddCircle";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import {
    Button,
    ButtonGroup,
    ClickAwayListener,
    Divider,
    Grow,
    MenuItem,
    MenuList,
    Paper,
    Popper,
} from "@mui/material";
import type { Item } from "@owlbear-rodeo/sdk";
import { useRef, useState } from "react";
import { usePlayerStorage } from "../state/usePlayerStorage";
import { isCandidateSource } from "../types/CandidateSource";
import { createAuras, createAurasWithDefaults } from "../utils/createAuras";

interface NewAuraButtonProps {
    disabled: boolean;
    targetedItems: Item[];
}

export function NewAuraButton({ disabled, targetedItems }: NewAuraButtonProps) {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);
    const presets = usePlayerStorage((store) => store.presets);
    const presetGroups = usePlayerStorage((store) => store.presetGroups);
    const getPresetConfigsById = usePlayerStorage(
        (store) => store.getPresetConfigsById,
    );

    const handleClose = (event: Event) => {
        if (anchorRef.current?.contains(event.target as HTMLElement)) {
            return;
        }

        setOpen(false);
    };

    return (
        <>
            <ButtonGroup
                variant="outlined"
                ref={anchorRef}
                aria-label="split button"
                disabled={disabled}
            >
                <Button
                    startIcon={<AddCircleIcon />}
                    onClick={() =>
                        createAurasWithDefaults(
                            targetedItems.filter(isCandidateSource),
                        )
                    }
                >
                    New
                </Button>
                <Button
                    size="small"
                    aria-controls={open ? "split-button-menu" : undefined}
                    aria-expanded={open ? "true" : undefined}
                    aria-haspopup="menu"
                    onClick={() => {
                        setOpen((prevOpen) => !prevOpen);
                    }}
                >
                    <ArrowDropDownIcon />
                </Button>
            </ButtonGroup>
            <Popper
                sx={{
                    zIndex: 1,
                }}
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
            >
                {({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === "bottom"
                                    ? "center top"
                                    : "center bottom",
                        }}
                    >
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList id="split-button-menu" autoFocusItem>
                                    {presets.map((preset) => (
                                        <MenuItem
                                            key={preset.id}
                                            onClick={() => {
                                                setOpen(false);
                                                return createAuras(
                                                    targetedItems.filter(
                                                        isCandidateSource,
                                                    ),
                                                    [preset.config],
                                                );
                                            }}
                                        >
                                            {preset.name}
                                        </MenuItem>
                                    ))}
                                    {presetGroups.length > 0 && <Divider />}
                                    {presetGroups.map((group) => (
                                        <MenuItem
                                            key={group.id}
                                            onClick={() => {
                                                setOpen(false);
                                                return createAuras(
                                                    targetedItems.filter(
                                                        isCandidateSource,
                                                    ),
                                                    getPresetConfigsById(
                                                        group.id,
                                                    ),
                                                );
                                            }}
                                        >
                                            {group.name}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </>
    );
}
