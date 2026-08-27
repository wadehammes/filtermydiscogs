export const COLLECTION_FIRST_PAGE_SIZE = 50;
export const COLLECTION_PAGE_SIZE = 100;
export const COLLECTION_BOOTSTRAP_SKIP_MIN_ITEMS = COLLECTION_PAGE_SIZE + 1;
export const COLLECTION_LARGE_MIN_ITEMS = 1000;
export const COLLECTION_CACHE_STALE_MS = 24 * 60 * 60 * 1000;
export const COLLECTION_NOTE_MAX_LENGTH = 10_000;
export const COLLECTION_RATING_MIN = 1;
export const COLLECTION_RATING_MAX = 5;
export const SIMILAR_RELEASES_LIMIT = 8;
export const RELEASE_MODAL_SIMILAR_LIMIT = 16;

export function isLargeCollection(totalItems: number): boolean {
  return totalItems > COLLECTION_LARGE_MIN_ITEMS;
}
