// This file maps layer names to their icon components. Icons are adapted from the outliner repo.
import SvgIcon from "@mui/material/SvgIcon";
import { Layer } from "@owlbear-rodeo/sdk";
import AttachmentIcon from "./layerIcons/AttachmentIcon";
import CharacterIcon from "./layerIcons/CharacterIcon";
import ControlIcon from "./layerIcons/ControlIcon";
import DrawingIcon from "./layerIcons/DrawingIcon";
import FogIcon from "./layerIcons/FogIcon";
import GridIcon from "./layerIcons/GridIcon";
import MapIcon from "./layerIcons/MapIcon";
import MountIcon from "./layerIcons/MountIcon";
import NoteIcon from "./layerIcons/NoteIcon";
import PointerIcon from "./layerIcons/PointerIcon";
import PopoverIcon from "./layerIcons/PopoverIcon";
import PostProcessIcon from "./layerIcons/PostProcessIcon";
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
    CONTROL: { icon: ControlIcon, isAdvanced: true },
    POST_PROCESS: { icon: PostProcessIcon, isAdvanced: true },
    POPOVER: { icon: PopoverIcon, isAdvanced: true },
};
