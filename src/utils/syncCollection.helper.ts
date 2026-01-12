import type { DiscogsCollection } from "src/types";

export interface SyncCollectionResult {
  isValid: boolean;
  error?: string;
  instanceIds?: string[];
}

/**
 * Validates collection data and extracts instance IDs for crate sync
 *
 * @param collectionData - The infinite query data containing collection pages
 * @param hasNextPage - Whether there are more pages to load
 * @param isFetchingNextPage - Whether currently fetching next page
 * @returns Result object with validation status and extracted instance IDs
 */
export function prepareCollectionForSync(
  collectionData: { pages: DiscogsCollection[] } | undefined,
  hasNextPage: boolean,
  isFetchingNextPage: boolean,
): SyncCollectionResult {
  // Check if collection data is available
  if (!collectionData?.pages || collectionData.pages.length === 0) {
    return {
      isValid: false,
      error:
        "Collection data is not available. Please wait for your collection to load.",
    };
  }

  // Check if collection is fully loaded
  if (hasNextPage || isFetchingNextPage) {
    return {
      isValid: false,
      error:
        "Please wait for your collection to finish loading before syncing.",
    };
  }

  // Extract all instance IDs from all loaded pages
  const collectionInstanceIds = collectionData.pages
    .flatMap((page: DiscogsCollection) => page?.releases ?? [])
    .map((release) => release?.instance_id)
    .filter((id): id is string => Boolean(id))
    .map(String);

  // Check if any releases were found
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
