import OBR from "@owlbear-rodeo/sdk";
import { isHexGrid } from "../utils/HexGridUtils";
import { GridParsed } from "./GridParsed";
import { SceneMetadata } from "./metadata/SceneMetadata";

export type AuraShape =
    | "circle"
    | "square"
    | "alternating"
    | "alternating_squares"
    | "manhattan"
    | "manhattan_squares"
    | "hex"
    | "hex_hexes";

export function isAuraShape(s: string) {
    return (
        s === "circle" ||
        s === "square" ||
        s === "alternating" ||
        s === "alternating_squares" ||
        s === "manhattan" ||
        s === "manhattan_squares" ||
        s === "hex" ||
        s === "hex_hexes"
    );
}

export function getAuraShape(
    grid: GridParsed,
    sceneMetadata: SceneMetadata,
): AuraShape {
    if (sceneMetadata.shapeOverride !== undefined) {
        return sceneMetadata.shapeOverride;
    }

    if (grid.measurement === "CHEBYSHEV" && grid.type === "SQUARE") {
        return "square";
    } else if (grid.measurement === "CHEBYSHEV" && isHexGrid(grid.type)) {
        return sceneMetadata.gridMode ? "hex_hexes" : "hex";
    } else if (grid.measurement === "MANHATTAN") {
        return sceneMetadata.gridMode ? "manhattan_squares" : "manhattan";
    } else if (grid.measurement === "ALTERNATING") {
        return sceneMetadata.gridMode ? "alternating_squares" : "alternating";
    }

    if (grid.measurement !== "EUCLIDEAN") {
        void OBR.notification.show(
            `Can't create simple aura for measurement type ${grid.measurement} on grid ${grid.type}, defaulting to Euclidean`,
            "WARNING",
        );
    }

    return "circle";
}
