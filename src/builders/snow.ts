import { GridParsed } from "owlbear-utils";
import { createAxonometricTransform } from "../utils/skslUtils";
import snowy_vortex from "./shaders/snowy_vortex.frag";

export function getSnowSksl(grid: GridParsed) {
    return [createAxonometricTransform(grid.type), snowy_vortex].join("\n");
}
