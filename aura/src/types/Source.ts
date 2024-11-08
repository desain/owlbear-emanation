import { Image, isImage, Item } from "@owlbear-rodeo/sdk";

import { METADATA_KEY } from '../constants';
import { HasMetadata } from '../metadata/metadataUtils';
import { SourceMetadata } from "../metadata/SourceMetadata";

export type Source = Image & HasMetadata<SourceMetadata>;

export function isSource(item: Item): item is Source {
    return isImage(item)
        && METADATA_KEY in item.metadata
        && typeof item.metadata[METADATA_KEY] === 'object';
}