import { Grid, GridScale } from '@owlbear-rodeo/sdk';

export interface GridParsed extends Omit<Grid, 'scale' | 'style'> {
    parsedScale: GridScale['parsed'];
}