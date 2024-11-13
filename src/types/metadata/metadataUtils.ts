import { METADATA_KEY } from "../../constants";

export interface HasMetadata<M> {
    metadata: {
        [METADATA_KEY]: M,
    };
}