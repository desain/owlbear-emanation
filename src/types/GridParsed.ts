import OBR, { Grid, GridScale } from "@owlbear-rodeo/sdk";
import { makeWatcher } from "../utils/watchers";

export interface GridParsed extends Pick<Grid, "dpi" | "type" | "measurement"> {
    parsedScale: GridScale["parsed"];
}

export async function getParsedGrid(): Promise<GridParsed> {
    const [dpi, fullScale, measurement, type] = await Promise.all([
        OBR.scene.grid.getDpi(),
        OBR.scene.grid.getScale(),
        OBR.scene.grid.getMeasurement(),
        OBR.scene.grid.getType(),
    ]);
    return {
        dpi,
        parsedScale: fullScale.parsed,
        measurement,
        type,
    };
}

export const watchGrid = makeWatcher(
    getParsedGrid,
    (cb) => OBR.scene.grid.onChange(cb),
    async (grid: Grid) => {
        const fullScale = await OBR.scene.grid.getScale();
        return {
            dpi: grid.dpi,
            parsedScale: fullScale.parsed,
            measurement: grid.measurement,
            type: grid.type,
        };
    },
);
