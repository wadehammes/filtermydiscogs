import { beforeEach, describe, expect, it } from "@jest/globals";
import { useAtomValue } from "jotai";
import { toast } from "sonner";
import { trackEvent } from "src/analytics/analytics";
import { fetchDiscogsCollection, syncCrates } from "src/api/helpers";
import { allReleasesAtom } from "src/atoms/filters.atoms";
import {
  COLLECTION_FIRST_PAGE_SIZE,
  COLLECTION_PAGE_SIZE,
} from "src/constants/collection";
import { useCollectionContext } from "src/context/collection.context";
import { DiscogsCollectionQueryKeys } from "src/hooks/queries/querykeys.constants";
import {
  useCollectionData,
  useCollectionLoadState,
} from "src/hooks/useCollectionData.hook";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import {
  installMockIndexedDb,
  readMockIndexedDbEntry,
  resetMockIndexedDb,
} from "src/tests/mocks/mockIndexedDb";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { createTestQueryClient } from "src/tests/utils/testQueryClient";
import {
  clearPersistedCollectionCaches,
  readPersistedCollectionCache,
  writePersistedCollectionCache,
} from "src/utils/collectionCacheStorage";
import { resetCollectionCacheReady } from "src/utils/collectionCacheSync";
import { COLLECTION_FULL_PAGE_PARAM } from "src/utils/collectionPagination";
import { act, renderFeatureHook, waitFor } from "test-utils";

jest.mock("src/api/helpers", () => ({
  fetchDiscogsCollection: jest.fn(),
  syncCrates: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    dismiss: jest.fn(),
  },
}));

jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

const mockFetchDiscogsCollection = jest.mocked(fetchDiscogsCollection);
const mockSyncCrates = jest.mocked(syncCrates);
const mockToastSuccess = jest.mocked(toast.success);
const mockTrackEvent = jest.mocked(trackEvent);

const buildSinglePageCollection = (releaseCount: number) => {
  const page = collectionFactory.build(
    {},
    { page: 1, totalPages: 1, releaseCount },
  );
  page.pagination.per_page = COLLECTION_FIRST_PAGE_SIZE;
  page.pagination.urls.next = "";
  return page;
};

const buildBootstrapCollection = (releaseCount: number) => {
  const page = collectionFactory.build(
    {},
    { page: 1, totalPages: 3, releaseCount },
  );
  page.pagination.per_page = COLLECTION_FIRST_PAGE_SIZE;
  page.pagination.urls.next =
    "https://api.discogs.com/users/testuser/collection/folders/0/releases?page=2&per_page=50";
  return page;
};

const buildFullCollectionPage = (releaseCount: number) => {
  const page = collectionFactory.build(
    {},
    { page: 1, totalPages: 2, releaseCount },
  );
  page.pagination.per_page = COLLECTION_PAGE_SIZE;
  page.pagination.urls.next = "";
  return page;
};

const buildCachedCollection = (releaseCount: number) => {
  const releases = releaseFactory.buildList(releaseCount);
  const page = collectionFactory.build({}, { totalItems: releaseCount });
  page.releases = releases;
  page.pagination.per_page = COLLECTION_PAGE_SIZE;
  page.pagination.urls.next = "";
  return page;
};

describe("useCollectionData", () => {
  beforeEach(() => {
    resetMockIndexedDb();
    installMockIndexedDb();
    resetCollectionCacheReady("testuser");
    void clearPersistedCollectionCaches();
    localStorage.clear();
    jest.clearAllMocks();
    mockSyncCrates.mockResolvedValue({ success: true, removedCount: 0 });
  });

  it("loads releases from the collection API into filter state", async () => {
    const page = buildSinglePageCollection(3);
    mockApiResponse(true, mockFetchDiscogsCollection, page, new Error("fail"));

    const { result } = renderFeatureHook(
      () => {
        useCollectionData({
          username: "testuser",
          isAuthenticated: true,
        });

        return useAtomValue(allReleasesAtom);
      },
      { includeCollectionSync: false },
    );

    await waitFor(() => {
      expect(result.current).toHaveLength(3);
    });
  });

  it("does not reload releases when the collection response is unchanged", async () => {
    const page = buildSinglePageCollection(3);
    mockApiResponse(true, mockFetchDiscogsCollection, page, new Error("fail"));

    const { rerender, result } = renderFeatureHook(
      () => {
        useCollectionData({
          username: "testuser",
          isAuthenticated: true,
        });

        return useAtomValue(allReleasesAtom);
      },
      { includeCollectionSync: false },
    );

    await waitFor(() => {
      expect(result.current).toHaveLength(3);
    });

    const callsAfterLoad = mockFetchDiscogsCollection.mock.calls.length;

    act(() => {
      rerender();
    });

    expect(result.current).toHaveLength(3);
    expect(mockFetchDiscogsCollection.mock.calls.length).toBe(callsAfterLoad);
  });

  it("updates collection context when a later page replaces the bootstrap page", async () => {
    const bootstrap = buildBootstrapCollection(2);
    const fullPage = buildFullCollectionPage(4);

    mockFetchDiscogsCollection
      .mockResolvedValueOnce(bootstrap)
      .mockResolvedValue(fullPage);

    const { result } = renderFeatureHook(
      () => {
        useCollectionData({
          username: "testuser",
          isAuthenticated: true,
        });

        return useCollectionContext().state.collection;
      },
      { includeCollectionSync: false },
    );

    await waitFor(() => {
      expect(result.current?.releases).toHaveLength(4);
    });
  });

  it("persists the collection to IndexedDB after a fresh full load", async () => {
    const page = buildSinglePageCollection(3);
    mockApiResponse(true, mockFetchDiscogsCollection, page, new Error("fail"));

    renderFeatureHook(
      () => {
        useCollectionData({
          username: "testuser",
          isAuthenticated: true,
        });
      },
      { includeCollectionSync: false },
    );

    await waitFor(async () => {
      const stored = await readPersistedCollectionCache("testuser");
      expect(stored?.totalItems).toBe(page.pagination.items);
    });
  });

  it("does not persist again when the collection was hydrated from cache", async () => {
    const cachedPage = buildCachedCollection(2);
    await writePersistedCollectionCache("testuser", {
      pages: [cachedPage],
      pageParams: [COLLECTION_FULL_PAGE_PARAM],
      totalItems: cachedPage.pagination.items,
      fetchedAt: Date.now(),
    });

    mockFetchDiscogsCollection.mockResolvedValue(
      collectionFactory.build({}, { totalItems: cachedPage.pagination.items }),
    );

    renderFeatureHook(
      () => {
        useCollectionData({
          username: "testuser",
          isAuthenticated: true,
        });
      },
      { includeCollectionSync: false },
    );

    await waitFor(async () => {
      expect(await readPersistedCollectionCache("testuser")).not.toBeNull();
    });

    const entryBefore = readMockIndexedDbEntry("testuser");
    await waitFor(() => {
      expect(mockFetchDiscogsCollection).toHaveBeenCalled();
    });

    expect(readMockIndexedDbEntry("testuser")).toEqual(entryBefore);
  });

  it("refetches on the same visit when Discogs collection size changed", async () => {
    const stalePage = buildCachedCollection(2);
    const freshPage = buildSinglePageCollection(3);
    await writePersistedCollectionCache("testuser", {
      pages: [stalePage],
      pageParams: [COLLECTION_FULL_PAGE_PARAM],
      totalItems: stalePage.pagination.items,
      fetchedAt: Date.now(),
    });

    mockFetchDiscogsCollection
      .mockResolvedValueOnce(
        collectionFactory.build({}, { totalItems: freshPage.pagination.items }),
      )
      .mockResolvedValue(freshPage);

    const { result } = renderFeatureHook(
      () => {
        useCollectionData({
          username: "testuser",
          isAuthenticated: true,
        });

        return useAtomValue(allReleasesAtom);
      },
      { includeCollectionSync: false },
    );

    await waitFor(() => {
      expect(result.current).toHaveLength(3);
    });

    expect(mockFetchDiscogsCollection.mock.calls.length).toBeGreaterThan(1);
  });

  it("runs automatic crate sync once after a validated cache hit", async () => {
    const cachedPage = buildCachedCollection(2);
    await writePersistedCollectionCache("testuser", {
      pages: [cachedPage],
      pageParams: [COLLECTION_FULL_PAGE_PARAM],
      totalItems: cachedPage.pagination.items,
      fetchedAt: Date.now(),
    });

    mockFetchDiscogsCollection.mockResolvedValue(
      collectionFactory.build({}, { totalItems: cachedPage.pagination.items }),
    );
    mockSyncCrates.mockResolvedValue({ success: true, removedCount: 2 });

    renderFeatureHook(
      () => {
        useCollectionData({
          username: "testuser",
          isAuthenticated: true,
        });
      },
      {
        authInitialState: testAuthenticatedAuthState,
        includeCollectionSync: false,
      },
    );

    await waitFor(() => {
      expect(mockSyncCrates).toHaveBeenCalledTimes(1);
    });

    expect(mockSyncCrates).toHaveBeenCalledWith(
      [
        cachedPage.releases[0]?.instance_id,
        cachedPage.releases[1]?.instance_id,
      ].map(String),
    );
    expect(mockTrackEvent).toHaveBeenCalledWith(
      "crateSync",
      expect.objectContaining({ action: "crateSyncAuto" }),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Sync complete: Removed 2 releases from your crates.",
    );
  });

  it("does not invalidate the collection query on first mount", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const page = buildSinglePageCollection(3);
    mockApiResponse(true, mockFetchDiscogsCollection, page, new Error("fail"));

    renderFeatureHook(
      () => {
        useCollectionData({
          username: "testuser",
          isAuthenticated: true,
        });
      },
      {
        queryClient,
        includeCollectionSync: false,
      },
    );

    await waitFor(() => {
      expect(mockFetchDiscogsCollection).toHaveBeenCalled();
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe("useCollectionLoadState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reads loading state from the shared query cache without fetching", async () => {
    const queryClient = createTestQueryClient();
    const page = buildSinglePageCollection(3);
    queryClient.setQueryData(
      DiscogsCollectionQueryKeys.byUsername("testuser"),
      {
        pages: [page],
        pageParams: [COLLECTION_FULL_PAGE_PARAM],
      },
    );

    const { result } = renderFeatureHook(() => useCollectionLoadState(), {
      queryClient,
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetchDiscogsCollection).not.toHaveBeenCalled();
  });

  it("reports loading while authenticated and the shared cache is still empty", () => {
    const { result } = renderFeatureHook(() => useCollectionLoadState(), {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });

    expect(result.current.isLoading).toBe(true);
    expect(mockFetchDiscogsCollection).not.toHaveBeenCalled();
  });
});
