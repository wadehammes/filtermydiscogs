import { beforeEach, describe, expect, it } from "@jest/globals";
import { COLLECTION_CACHE_STALE_MS } from "src/constants/collection";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import {
  installMockIndexedDb,
  readMockIndexedDbEntry,
  resetMockIndexedDb,
} from "src/tests/mocks/mockIndexedDb";
import {
  clearPersistedCollectionCache,
  clearPersistedCollectionCaches,
  type PersistedCollectionCache,
  parsePersistedCollectionCache,
  readPersistedCollectionCache,
  writePersistedCollectionCache,
} from "src/utils/collectionCacheStorage";
import { COLLECTION_FULL_PAGE_PARAM } from "src/utils/collectionPagination";

const buildPersistedCache = (
  overrides: Partial<PersistedCollectionCache> = {},
): PersistedCollectionCache => {
  const page = collectionFactory.build({}, { totalItems: 2500 });
  return {
    pages: [page],
    pageParams: [COLLECTION_FULL_PAGE_PARAM],
    totalItems: 2500,
    fetchedAt: Date.now(),
    ...overrides,
  };
};

describe("collectionCacheStorage", () => {
  beforeEach(() => {
    resetMockIndexedDb();
    installMockIndexedDb();
    void clearPersistedCollectionCaches();
  });

  describe("parsePersistedCollectionCache", () => {
    it("rejects invalid payloads", () => {
      expect(parsePersistedCollectionCache(null)).toBeNull();
      expect(parsePersistedCollectionCache({ pages: [] })).toBeNull();
      expect(
        parsePersistedCollectionCache({
          pages: [collectionFactory.build()],
          pageParams: [],
          totalItems: 10,
          fetchedAt: Date.now(),
        }),
      ).toBeNull();
    });
  });

  describe("read and write", () => {
    it("writes and reads a cache entry by normalized username", async () => {
      const cache = buildPersistedCache({ totalItems: 1800 });

      await writePersistedCollectionCache("  TestUser ", cache);

      const stored = await readPersistedCollectionCache("testuser");

      expect(stored?.totalItems).toBe(1800);
      expect(stored?.pages).toHaveLength(1);
      expect(readMockIndexedDbEntry("testuser")).toEqual(cache);
    });

    it("reads entries regardless of age until cleared or invalidated", async () => {
      const oldCache = buildPersistedCache({
        fetchedAt: Date.now() - COLLECTION_CACHE_STALE_MS - 1,
      });

      await writePersistedCollectionCache("testuser", oldCache);

      await expect(readPersistedCollectionCache("testuser")).resolves.toEqual(
        oldCache,
      );
      expect(readMockIndexedDbEntry("testuser")).toEqual(oldCache);
    });

    it("clears a single user's cache entry", async () => {
      await writePersistedCollectionCache("testuser", buildPersistedCache());

      await clearPersistedCollectionCache("TestUser");

      await expect(
        readPersistedCollectionCache("testuser"),
      ).resolves.toBeNull();
    });

    it("clears all cache entries", async () => {
      await writePersistedCollectionCache("user-a", buildPersistedCache());
      await writePersistedCollectionCache("user-b", buildPersistedCache());

      await clearPersistedCollectionCaches();

      await expect(readPersistedCollectionCache("user-a")).resolves.toBeNull();
      await expect(readPersistedCollectionCache("user-b")).resolves.toBeNull();
    });
  });
});
