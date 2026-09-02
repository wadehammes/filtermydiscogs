import { beforeEach, describe, expect, it } from "@jest/globals";
import { useAtomValue } from "jotai";
import { ApiFetchError } from "src/api/apiFetchError";
import { api } from "src/api/urls";
import { allReleasesAtom } from "src/atoms/filters.atoms";
import {
  COLLECTION_FIRST_PAGE_SIZE,
  COLLECTION_PAGE_SIZE,
} from "src/constants/collection";
import { useCollectionContext } from "src/context/collection.context";
import { useCollectionData } from "src/hooks/useCollectionData.hook";
import { authStatusFactory } from "src/tests/factories/AuthStatus.factory";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import {
  installMockIndexedDb,
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
import { persistCollectionItemCount } from "src/utils/collectionItemCountStorage";
import { COLLECTION_FULL_PAGE_PARAM } from "src/utils/collectionPagination";
import { toast } from "src/utils/toast";
import { act, renderFeatureHook, waitFor } from "test-utils";

jest.mock("src/api/urls", () => ({
  api: {
    checkAuth: jest.fn(),
    discogsCollection: jest.fn(),
    syncCrates: jest.fn(),
  },
}));

jest.mock("src/utils/toast", () => ({
  toast: {
    success: jest.fn(),
    dismiss: jest.fn(),
  },
}));

const mockCheckAuth = jest.mocked(api.checkAuth);
const mockFetchDiscogsCollection = jest.mocked(api.discogsCollection);
const mockSyncCrates = jest.mocked(api.syncCrates);
const mockToastSuccess = jest.mocked(toast.success);

const buildSinglePageCollection = (releaseCount: number) => {
  const page = collectionFactory.build(
    {},
    { page: 1, totalPages: 1, releaseCount, totalItems: releaseCount },
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
    mockSyncCrates.mockResolvedValue(crateMutationSuccessFactory.sync(0));
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

  it("persists collection data after a validated cache hit", async () => {
    const cachedPage = buildCachedCollection(2);
    const initialFetchedAt = Date.now() - 60_000;
    await writePersistedCollectionCache("testuser", {
      pages: [cachedPage],
      pageParams: [COLLECTION_FULL_PAGE_PARAM],
      totalItems: cachedPage.pagination.items,
      fetchedAt: initialFetchedAt,
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
      const stored = await readPersistedCollectionCache("testuser");
      expect(stored?.fetchedAt).toBeGreaterThan(initialFetchedAt);
    });
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
    mockSyncCrates.mockResolvedValue(crateMutationSuccessFactory.sync(2));

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
    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Sync complete: Removed 2 releases from your crates.",
    );
  });

  it("does not retry automatic crate sync after a failed sync", async () => {
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
    mockSyncCrates.mockRejectedValue(new Error("HTTP error! status: 429"));

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

    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(mockSyncCrates).toHaveBeenCalledTimes(1);
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

  it("rechecks auth and retries the collection fetch after a 401", async () => {
    const page = buildSinglePageCollection(3);
    mockFetchDiscogsCollection
      .mockRejectedValueOnce(new ApiFetchError(401, "Not authenticated"))
      .mockResolvedValueOnce(page);
    mockCheckAuth.mockResolvedValueOnce(authStatusFactory.authenticated());

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

    expect(mockFetchDiscogsCollection).toHaveBeenCalledTimes(2);
    expect(mockFetchDiscogsCollection).toHaveBeenCalledWith({
      username: "testuser",
      page: 1,
      perPage: COLLECTION_FIRST_PAGE_SIZE,
    });
    expect(mockCheckAuth).toHaveBeenCalledTimes(1);
  });

  it("starts at full page size when a large collection size is stored", async () => {
    persistCollectionItemCount("testuser", 11_400);
    const page = collectionFactory.build(
      {},
      { page: 1, totalPages: 114, totalItems: 11_400, releaseCount: 4 },
    );
    page.pagination.per_page = COLLECTION_PAGE_SIZE;
    page.pagination.urls.next = "";
    mockFetchDiscogsCollection.mockResolvedValueOnce(page);

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
      expect(result.current).toHaveLength(4);
    });

    expect(mockFetchDiscogsCollection).toHaveBeenCalledTimes(1);
    expect(mockFetchDiscogsCollection).toHaveBeenCalledWith({
      username: "testuser",
      page: 1,
      perPage: COLLECTION_PAGE_SIZE,
    });
  });

  it("dispatches an error when a 401 session is gone", async () => {
    mockFetchDiscogsCollection.mockRejectedValueOnce(
      new ApiFetchError(401, "Not authenticated"),
    );
    mockCheckAuth.mockResolvedValueOnce(authStatusFactory.unauthenticated());

    const { result } = renderFeatureHook(
      () => {
        useCollectionData({
          username: "testuser",
          isAuthenticated: true,
        });

        return useCollectionContext().state;
      },
      { includeCollectionSync: false },
    );

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(mockFetchDiscogsCollection).toHaveBeenCalledTimes(1);
    expect(mockCheckAuth).toHaveBeenCalledTimes(1);
  });

  it("retries after a 503 without rechecking auth", async () => {
    const page = buildSinglePageCollection(3);
    mockFetchDiscogsCollection
      .mockRejectedValueOnce(
        new ApiFetchError(
          503,
          "Discogs rate limit exceeded. Please try again shortly.",
          10,
        ),
      )
      .mockResolvedValueOnce(page);

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

    await waitFor(
      () => {
        expect(result.current).toHaveLength(3);
      },
      { timeout: 3000 },
    );

    expect(mockFetchDiscogsCollection).toHaveBeenCalledTimes(2);
    expect(mockCheckAuth).not.toHaveBeenCalled();
  });
});
