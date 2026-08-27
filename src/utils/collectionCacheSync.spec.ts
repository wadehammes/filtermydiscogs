import { beforeEach, describe, expect, it } from "@jest/globals";
import { fetchDiscogsCollection } from "src/api/helpers";
import { COLLECTION_PAGE_SIZE } from "src/constants/collection";
import { DiscogsCollectionQueryKeys } from "src/hooks/queries/querykeys.constants";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  installMockIndexedDb,
  resetMockIndexedDb,
} from "src/tests/mocks/mockIndexedDb";
import { createTestQueryClient } from "src/tests/utils/testQueryClient";
import {
  clearPersistedCollectionCaches,
  writePersistedCollectionCache,
} from "src/utils/collectionCacheStorage";
import {
  ensureCollectionCacheHydrated,
  ensureCollectionCacheValidated,
  hydrateCollectionQueryFromCache,
  patchPersistedCollectionReleaseRating,
  persistCollectionQueryToCache,
  prepareCollectionQueryFromCache,
  resetCollectionCacheReady,
  validatePersistedCollectionCache,
} from "src/utils/collectionCacheSync";
import { COLLECTION_FULL_PAGE_PARAM } from "src/utils/collectionPagination";

jest.mock("src/api/helpers", () => ({
  fetchDiscogsCollection: jest.fn(),
}));

const mockFetchDiscogsCollection = jest.mocked(fetchDiscogsCollection);

const buildPersistedCache = (totalItems: number) => {
  const page = collectionFactory.build({}, { totalItems, totalPages: 2 });
  page.pagination.urls.next = "https://example.com/next";
  return {
    pages: [page],
    pageParams: [COLLECTION_FULL_PAGE_PARAM],
    totalItems,
    fetchedAt: Date.now(),
  };
};

describe("collectionCacheSync", () => {
  beforeEach(() => {
    resetMockIndexedDb();
    installMockIndexedDb();
    resetCollectionCacheReady("testuser");
    void clearPersistedCollectionCaches();
    jest.clearAllMocks();
  });

  it("hydrates React Query from persisted cache data", () => {
    const queryClient = createTestQueryClient();
    const cached = buildPersistedCache(1500);

    hydrateCollectionQueryFromCache(queryClient, "testuser", cached);

    expect(
      queryClient.getQueryData(
        DiscogsCollectionQueryKeys.byUsername("testuser"),
      ),
    ).toEqual({
      pages: cached.pages,
      pageParams: cached.pageParams,
    });
  });

  it("returns false when there is no persisted cache to hydrate", async () => {
    const queryClient = createTestQueryClient();

    await expect(
      ensureCollectionCacheHydrated(queryClient, "testuser"),
    ).resolves.toBe(false);
  });

  it("hydrates once and deduplicates concurrent hydrate calls", async () => {
    const queryClient = createTestQueryClient();
    await writePersistedCollectionCache("testuser", buildPersistedCache(1500));

    const [first, second] = await Promise.all([
      ensureCollectionCacheHydrated(queryClient, "testuser"),
      ensureCollectionCacheHydrated(queryClient, "testuser"),
    ]);

    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(
      queryClient.getQueryData(
        DiscogsCollectionQueryKeys.byUsername("testuser"),
      ),
    ).toBeTruthy();
  });

  it("validates a cache entry when Discogs total items still match", async () => {
    const queryClient = createTestQueryClient();
    const cached = buildPersistedCache(1500);
    const validationPage = collectionFactory.build({}, { totalItems: 1500 });
    mockFetchDiscogsCollection.mockResolvedValue(validationPage);

    await expect(
      validatePersistedCollectionCache(queryClient, "testuser", cached),
    ).resolves.toBe(true);

    expect(mockFetchDiscogsCollection).toHaveBeenCalledWith({
      username: "testuser",
      page: 1,
      perPage: COLLECTION_PAGE_SIZE,
    });
  });

  it("clears cache and query data when Discogs total items changed", async () => {
    const queryClient = createTestQueryClient();
    const cached = buildPersistedCache(1500);
    hydrateCollectionQueryFromCache(queryClient, "testuser", cached);

    mockFetchDiscogsCollection.mockResolvedValue(
      collectionFactory.build({}, { totalItems: 1501 }),
    );

    await expect(
      validatePersistedCollectionCache(queryClient, "testuser", cached),
    ).resolves.toBe(false);

    expect(
      queryClient.getQueryData(
        DiscogsCollectionQueryKeys.byUsername("testuser"),
      ),
    ).toBeUndefined();
  });

  it("validates before hydrating so stale cache never enters React Query", async () => {
    const queryClient = createTestQueryClient();
    await writePersistedCollectionCache("testuser", buildPersistedCache(1500));
    mockFetchDiscogsCollection.mockResolvedValue(
      collectionFactory.build({}, { totalItems: 1501 }),
    );

    const result = await prepareCollectionQueryFromCache(
      queryClient,
      "testuser",
    );

    expect(result.hydratedFromCache).toBe(false);
    expect(
      queryClient.getQueryData(
        DiscogsCollectionQueryKeys.byUsername("testuser"),
      ),
    ).toBeUndefined();
  });

  it("hydrates React Query only after validation succeeds", async () => {
    const queryClient = createTestQueryClient();
    await writePersistedCollectionCache("testuser", buildPersistedCache(1500));
    mockFetchDiscogsCollection.mockResolvedValue(
      collectionFactory.build({}, { totalItems: 1500 }),
    );

    const result = await prepareCollectionQueryFromCache(
      queryClient,
      "testuser",
    );

    expect(result.hydratedFromCache).toBe(true);
    expect(
      queryClient.getQueryData(
        DiscogsCollectionQueryKeys.byUsername("testuser"),
      ),
    ).toBeTruthy();
  });

  it("deduplicates concurrent validate calls", async () => {
    const queryClient = createTestQueryClient();
    await writePersistedCollectionCache("testuser", buildPersistedCache(1500));
    mockFetchDiscogsCollection.mockResolvedValue(
      collectionFactory.build({}, { totalItems: 1500 }),
    );

    const [first, second] = await Promise.all([
      ensureCollectionCacheValidated(queryClient, "testuser"),
      ensureCollectionCacheValidated(queryClient, "testuser"),
    ]);

    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(mockFetchDiscogsCollection).toHaveBeenCalledTimes(1);
  });

  it("persists loaded query pages to IndexedDB", async () => {
    const page = collectionFactory.build(
      {},
      { totalItems: 2200, totalPages: 22 },
    );
    page.pagination.urls.next = "";

    await persistCollectionQueryToCache(
      "testuser",
      [page],
      [COLLECTION_FULL_PAGE_PARAM],
    );

    const stored = await import("src/utils/collectionCacheStorage").then(
      (module) => module.readPersistedCollectionCache("testuser"),
    );

    expect(stored?.totalItems).toBe(2200);
    expect(stored?.pages).toHaveLength(1);
  });

  it("skips persisting when pages or totals are missing", async () => {
    await persistCollectionQueryToCache("testuser", [], []);
    await persistCollectionQueryToCache(
      "testuser",
      [
        {
          ...collectionFactory.build(),
          pagination: {
            ...collectionFactory.build().pagination,
            items: Number.NaN,
          },
        },
      ],
      [COLLECTION_FULL_PAGE_PARAM],
    );

    const stored = await import("src/utils/collectionCacheStorage").then(
      (module) => module.readPersistedCollectionCache("testuser"),
    );

    expect(stored).toBeNull();
  });

  it("patches a personal rating in the persisted collection cache", async () => {
    const release = releaseFactory.withResourceUrl(249504, { rating: 0 });
    const page = collectionFactory.build(
      {},
      { releaseCount: 1, totalPages: 1 },
    );
    page.releases = [release];

    await writePersistedCollectionCache("testuser", {
      pages: [page],
      pageParams: [COLLECTION_FULL_PAGE_PARAM],
      totalItems: 1,
      fetchedAt: Date.now(),
    });

    await patchPersistedCollectionReleaseRating("testuser", 249504, 5);

    const stored = await import("src/utils/collectionCacheStorage").then(
      (module) => module.readPersistedCollectionCache("testuser"),
    );

    expect(stored?.pages[0]?.releases[0]?.rating).toBe(5);
  });
});
