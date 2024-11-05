import { EmanationStyle } from '../types/EmanationStyle';

/**
 * Metadata for emanations.
 */
export interface EmanationMetadata {
    /**
     * Size of the emanation, in grid units (eg 5 for 5 ft).
     */
    size: number;
    style: EmanationStyle;
}