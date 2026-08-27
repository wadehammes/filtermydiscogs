import { beforeEach, describe, expect, it } from "@jest/globals";
import type { InfiniteData } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "src/api/urls";
import { COLLECTION_FIRST_PAGE_SIZE } from "src/constants/collection";
import { DiscogsCollectionQueryKeys } from "src/hooks/queries/querykeys.constants";
import { useCrateCollectionSync } from "src/hooks/useCrateCollectionSync.hook";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { createTestQueryClient } from "src/tests/utils/testQueryClient";
import type { DiscogsCollection } from "src/types";
import { COLLECTION_FULL_PAGE_PARAM } from "src/utils/collectionPagination";
import { act, renderHookWithTestProviders, waitFor } from "test-utils";

jest.mock("src/api/urls", () => ({
  api: {
    discogsCollection: jest.fn(),
    syncCrates: jest.fn(),
    crates: jest.fn(),
    crate: jest.fn(),
  },
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

const mockApi = jest.mocked(api);
const mockSyncCrates = jest.mocked(api.syncCrates);
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

const seedLoadedCollectionQuery = (
  queryClient: ReturnType<typeof createTestQueryClient>,
) => {
  const page = buildLoadedCollection();
  const data: InfiniteData<DiscogsCollection> = {
    pages: [page],
    pageParams: [COLLECTION_FULL_PAGE_PARAM],
  };
  queryClient.setQueryData(
    DiscogsCollectionQueryKeys.byUsername("testuser"),
    data,
  );
};

describe("useCrateCollectionSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultCrateApiMocks(mockApi);
    mockSyncCrates.mockResolvedValue({ success: true, removedCount: 0 });
  });

  it("opens and closes the sync dialog", () => {
    const queryClient = createTestQueryClient();
    seedLoadedCollectionQuery(queryClient);

    const { result } = renderHookWithTestProviders(
      () => useCrateCollectionSync(),
      {
        authInitialState: testAuthenticatedAuthState,
        queryClient,
        includeCollectionSync: false,
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

  it("syncs crates from the shared collection query cache", async () => {
    const queryClient = createTestQueryClient();
    seedLoadedCollectionQuery(queryClient);

    const { result } = renderHookWithTestProviders(
      () => useCrateCollectionSync(),
      {
        authInitialState: testAuthenticatedAuthState,
        queryClient,
        includeCollectionSync: false,
      },
    );

    await waitFor(() => {
      expect(result.current.isCollectionLoading).toBe(false);
    });

    act(() => {
      result.current.openSyncDialog();
      result.current.confirmSync();
    });

    await waitFor(() => {
      expect(mockSyncCrates).toHaveBeenCalled();
    });

    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Sync complete: All releases in your crates are still in your collection.",
    );
    expect(result.current.showSyncDialog).toBe(false);
    expect(mockApi.discogsCollection).not.toHaveBeenCalled();
  });

  it("shows an error when sync is attempted before the shared cache is loaded", async () => {
    const queryClient = createTestQueryClient();

    const { result } = renderHookWithTestProviders(
      () => useCrateCollectionSync(),
      {
        authInitialState: testAuthenticatedAuthState,
        queryClient,
        includeCollectionSync: false,
      },
    );

    expect(result.current.isCollectionLoading).toBe(true);

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
