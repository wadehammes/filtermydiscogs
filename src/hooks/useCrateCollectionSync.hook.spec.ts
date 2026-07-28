import { beforeEach, describe, expect, it } from "@jest/globals";
import { toast } from "sonner";
import * as apiHelpers from "src/api/helpers";
import { COLLECTION_FIRST_PAGE_SIZE } from "src/constants/collection";
import { useCrateCollectionSync } from "src/hooks/useCrateCollectionSync.hook";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { act, renderHookWithTestProviders, waitFor } from "test-utils";

jest.mock("src/api/helpers", () => ({
  fetchDiscogsCollection: jest.fn(),
  syncCrates: jest.fn(),
  fetchCrates: jest.fn(),
  fetchCrate: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

const mockApi = jest.mocked(apiHelpers);
const mockFetchDiscogsCollection = jest.mocked(
  apiHelpers.fetchDiscogsCollection,
);
const mockSyncCrates = jest.mocked(apiHelpers.syncCrates);
const mockToastSuccess = jest.mocked(toast.success);
const mockToastError = jest.mocked(toast.error);

const buildLoadedCollection = () => {
  const page = collectionFactory.build(
    {},
    { page: 1, totalPages: 1, releaseCount: 2 },
  );
  page.pagination.per_page = COLLECTION_FIRST_PAGE_SIZE;
  page.pagination.urls.next = "";
  return page;
};

describe("useCrateCollectionSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultCrateApiMocks(mockApi);
    mockApiResponse(
      true,
      mockFetchDiscogsCollection,
      buildLoadedCollection(),
      new Error("Collection fetch failed"),
    );
    mockSyncCrates.mockResolvedValue({ success: true, removedCount: 0 });
  });

  it("opens and closes the sync dialog", async () => {
    const { result } = renderHookWithTestProviders(
      () => useCrateCollectionSync(),
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );

    act(() => {
      result.current.openSyncDialog();
    });

    expect(result.current.showSyncDialog).toBe(true);

    act(() => {
      result.current.closeSyncDialog();
    });

    expect(result.current.showSyncDialog).toBe(false);
  });

  it("syncs crates after the collection finishes loading", async () => {
    const { result } = renderHookWithTestProviders(
      () => useCrateCollectionSync(),
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );

    await waitFor(() => {
      expect(result.current.isCollectionLoading).toBe(false);
    });

    act(() => {
      result.current.openSyncDialog();
    });

    act(() => {
      result.current.confirmSync();
    });

    await waitFor(() => {
      expect(mockSyncCrates).toHaveBeenCalled();
    });

    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Sync complete: All releases in your crates are still in your collection.",
    );
    expect(result.current.showSyncDialog).toBe(false);
  });

  it("shows an error when sync is attempted before the collection finishes loading", async () => {
    mockApiResponse(
      true,
      mockFetchDiscogsCollection,
      collectionFactory.build({}, { page: 1, totalPages: 3, releaseCount: 2 }),
      new Error("Collection fetch failed"),
    );

    const { result } = renderHookWithTestProviders(
      () => useCrateCollectionSync(),
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );

    await waitFor(() => {
      expect(result.current.isCollectionLoading).toBe(true);
    });

    act(() => {
      result.current.openSyncDialog();
      result.current.confirmSync();
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringMatching(/wait for your collection/i),
      );
    });

    expect(mockSyncCrates).not.toHaveBeenCalled();
  });
});
