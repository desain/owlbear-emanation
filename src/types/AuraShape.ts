import type { GridType } from "@owlbear-rodeo/sdk";
import OBR from "@owlbear-rodeo/sdk";
import type { GridParsed } from "owlbear-utils";
import { isHexGrid } from "owlbear-utils";
import type { AuraConfig } from "./AuraConfig";
import type { SceneMetadata } from "./metadata/SceneMetadata";

export type AuraShape =
    | "circle"
    | "square"
    | "alternating"
    | "alternating_squares"
    | "manhattan"
    | "manhattan_squares"
    | "hex"
    | "hex_hexes";

export function isAuraShape(s: unknown): s is AuraShape {
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

function isSquareType(gridType: GridType) {
    return (
        gridType === "SQUARE" ||
        gridType === "ISOMETRIC" ||
        gridType === "DIMETRIC"
    );
}

export function getAuraShape(
    config: AuraConfig,
    sceneMetadata: SceneMetadata,
    grid: GridParsed,
): AuraShape {
    if (config.shapeOverride) {
        return config.shapeOverride;
    } else if (sceneMetadata.shapeOverride) {
        return sceneMetadata.shapeOverride;
    }

    if (grid.measurement === "CHEBYSHEV" && isSquareType(grid.type)) {
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
