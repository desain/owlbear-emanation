import { AuraStyle } from '../AuraStyle';

/**
 * Metadata for auras.
 */
export interface AuraMetadata {
    /**
     * Size of the aura, in grid units (eg 5 for 5 ft).
     */
    size: number;
    style: AuraStyle;
}