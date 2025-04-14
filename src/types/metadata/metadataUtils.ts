import { HasParameterizedMetadata } from "owlbear-utils";
import { METADATA_KEY } from "../../constants";

export type HasMetadata<M> = HasParameterizedMetadata<typeof METADATA_KEY, M>;
