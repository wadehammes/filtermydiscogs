import type { DiscogsCollection } from "src/types";
import { getEffectiveCollectionPages } from "src/utils/collectionPagination";

export interface SyncCollectionResult {
  isValid: boolean;
  error?: string;
  instanceIds?: string[];
}

export function prepareCollectionForSync(
  collectionData: { pages: DiscogsCollection[] } | undefined,
  hasNextPage: boolean,
  isFetchingNextPage: boolean,
): SyncCollectionResult {
  if (!collectionData?.pages || collectionData.pages.length === 0) {
    return {
      isValid: false,
      error:
        "Collection data is not available. Please wait for your collection to load.",
    };
  }

  if (hasNextPage || isFetchingNextPage) {
    return {
      isValid: false,
      error:
        "Please wait for your collection to finish loading before syncing.",
    };
  }

  const collectionInstanceIds = getEffectiveCollectionPages({
    pages: collectionData.pages,
  })
    .flatMap((page: DiscogsCollection) => page?.releases ?? [])
    .map((release) => release?.instance_id)
    .filter((id): id is string => Boolean(id))
    .map(String);

  if (collectionInstanceIds.length === 0) {
    return {
      isValid: false,
      error: "No releases found in your collection.",
    };
  }

  return {
    isValid: true,
    instanceIds: collectionInstanceIds,
  };
}
