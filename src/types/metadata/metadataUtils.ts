import type { HasParameterizedMetadata } from "owlbear-utils";
import type { METADATA_KEY } from "../../constants";

export type HasMetadata<M> = HasParameterizedMetadata<typeof METADATA_KEY, M>;
