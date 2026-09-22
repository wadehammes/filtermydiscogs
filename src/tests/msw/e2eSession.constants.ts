export const E2E_AUTH_USERNAME = "testuser";
export const E2E_COLLECTION_RELEASE_COUNT = 3;
export const E2E_ALBUM_ONE = "E2E Album One";
export const E2E_ALBUM_TWO = "E2E Album Two";
export const E2E_ALBUM_THREE = "E2E Album Three";
export const E2E_DEFAULT_CRATE_ID = "crate-1";
export const E2E_DEFAULT_CRATE_NAME = "Test Crate";
export const E2E_MOST_CRATED_CRATE_COUNT = 2;
export const E2E_TRACK_ONE = "E2E Track One";
export const E2E_TRACK_TWO = "E2E Track Two";

export function e2eCollectionSummaryLabel(): string {
  return `Showing ${E2E_COLLECTION_RELEASE_COUNT} releases`;
}

export function e2eMosaicCollectionSummaryLabel(): string {
  return `Showing all ${E2E_COLLECTION_RELEASE_COUNT} releases from your collection`;
}

export function e2eDashboardCollectionHeading(): string {
  return `${E2E_AUTH_USERNAME}'s collection`;
}

export function e2eDashboardHeroCountLabel(): string {
  return String(E2E_COLLECTION_RELEASE_COUNT);
}
