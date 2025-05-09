// This file maps layer names to their icon components. Most layer icons are adapted from the outliner repo.
import AdsClickIcon from "@mui/icons-material/AdsClick";
import FunctionsIcon from "@mui/icons-material/Functions";
import WysiwygIcon from "@mui/icons-material/Wysiwyg";
import type SvgIcon from "@mui/material/SvgIcon";
import type { Layer } from "@owlbear-rodeo/sdk";
import AttachmentIcon from "./layerIcons/AttachmentIcon";
import CharacterIcon from "./layerIcons/CharacterIcon";
import DrawingIcon from "./layerIcons/DrawingIcon";
import FogIcon from "./layerIcons/FogIcon";
import GridIcon from "./layerIcons/GridIcon";
import MapIcon from "./layerIcons/MapIcon";
import MountIcon from "./layerIcons/MountIcon";
import NoteIcon from "./layerIcons/NoteIcon";
import PointerIcon from "./layerIcons/PointerIcon";
import PropIcon from "./layerIcons/PropIcon";
import RulerIcon from "./layerIcons/RulerIcon";
import TextIcon from "./layerIcons/TextIcon";

export const LAYER_ICONS: Record<
    Layer,
    { icon: typeof SvgIcon; isAdvanced: boolean }
> = {
    ATTACHMENT: { icon: AttachmentIcon, isAdvanced: false },
    CHARACTER: { icon: CharacterIcon, isAdvanced: false },
    DRAWING: { icon: DrawingIcon, isAdvanced: false },
    FOG: { icon: FogIcon, isAdvanced: false },
    MAP: { icon: MapIcon, isAdvanced: false },
    MOUNT: { icon: MountIcon, isAdvanced: false },
    NOTE: { icon: NoteIcon, isAdvanced: false },
    POINTER: { icon: PointerIcon, isAdvanced: false },
    PROP: { icon: PropIcon, isAdvanced: false },
    RULER: { icon: RulerIcon, isAdvanced: false },
    TEXT: { icon: TextIcon, isAdvanced: false },
    GRID: { icon: GridIcon, isAdvanced: true },
    CONTROL: { icon: AdsClickIcon, isAdvanced: true },
    POST_PROCESS: { icon: FunctionsIcon, isAdvanced: true },
    POPOVER: { icon: WysiwygIcon, isAdvanced: true },
};
