/**
 * Way of specifying a specific aura.
 */
export interface Specifier {
    /**
     * Which items has the aura.
     */
    sourceId: string;
    /**
     * Which item in the source's list of auras.
     */
    sourceScopedId: string;
}
