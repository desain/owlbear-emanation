import OBR, { Grid, GridScale } from "@owlbear-rodeo/sdk";

// params of interest from base grid object
export type GridParams = Pick<Grid, "dpi" | "type" | "measurement">;

// params of interest with scale context
export interface GridParsed extends GridParams {
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
