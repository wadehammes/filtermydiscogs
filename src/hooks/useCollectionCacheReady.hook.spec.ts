import { beforeEach, describe, expect, it } from "@jest/globals";
import { api } from "src/api/urls";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import {
  installMockIndexedDb,
  resetMockIndexedDb,
} from "src/tests/mocks/mockIndexedDb";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import {
  clearPersistedCollectionCaches,
  writePersistedCollectionCache,
} from "src/utils/collectionCacheStorage";
import { COLLECTION_FULL_PAGE_PARAM } from "src/utils/collectionPagination";
import { renderFeatureHook, waitFor } from "test-utils";
import {
  resetCollectionCacheReady,
  useCollectionCacheReady,
} from "./useCollectionCacheReady.hook";

jest.mock("src/api/urls", () => ({
  api: {
    discogsCollection: jest.fn(),
  },
}));

const mockFetchDiscogsCollection = jest.mocked(api.discogsCollection);

describe("useCollectionCacheReady", () => {
  beforeEach(() => {
    resetMockIndexedDb();
    installMockIndexedDb();
    resetCollectionCacheReady("testuser");
    void clearPersistedCollectionCaches();
    jest.clearAllMocks();
  });

  it("becomes ready immediately when there is no persisted cache", async () => {
    const { result } = renderFeatureHook(
      () =>
        useCollectionCacheReady({
          username: "testuser",
          enabled: true,
        }),
      {
        authInitialState: testAuthenticatedAuthState,
        includeCollectionSync: false,
      },
    );

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });

    expect(result.current.hydratedFromCache).toBe(false);
  });

  it("marks hydratedFromCache after hydrate and successful validation", async () => {
    const page = collectionFactory.build(
      {},
      { totalItems: 1500, totalPages: 15 },
    );
    await writePersistedCollectionCache("testuser", {
      pages: [page],
      pageParams: [COLLECTION_FULL_PAGE_PARAM],
      totalItems: 1500,
      fetchedAt: Date.now(),
    });
    mockFetchDiscogsCollection.mockResolvedValue(
      collectionFactory.build({}, { totalItems: 1500 }),
    );

    const { result } = renderFeatureHook(
      () =>
        useCollectionCacheReady({
          username: "testuser",
          enabled: true,
        }),
      {
        authInitialState: testAuthenticatedAuthState,
        includeCollectionSync: false,
      },
    );

    await waitFor(() => {
      expect(result.current.hydratedFromCache).toBe(true);
    });

    expect(result.current.ready).toBe(true);
  });

  it("does not mark hydratedFromCache when validation fails", async () => {
    const page = collectionFactory.build(
      {},
      { totalItems: 1500, totalPages: 15 },
    );
    await writePersistedCollectionCache("testuser", {
      pages: [page],
      pageParams: [COLLECTION_FULL_PAGE_PARAM],
      totalItems: 1500,
      fetchedAt: Date.now(),
    });
    mockFetchDiscogsCollection.mockResolvedValue(
      collectionFactory.build({}, { totalItems: 1501 }),
    );

    const { result } = renderFeatureHook(
      () =>
        useCollectionCacheReady({
          username: "testuser",
          enabled: true,
        }),
      {
        authInitialState: testAuthenticatedAuthState,
        includeCollectionSync: false,
      },
    );

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });

    expect(result.current.hydratedFromCache).toBe(false);
  });

  it("shares ready state across hook instances for the same username", async () => {
    const { result: firstResult } = renderFeatureHook(
      () =>
        useCollectionCacheReady({
          username: "testuser",
          enabled: true,
        }),
      {
        authInitialState: testAuthenticatedAuthState,
        includeCollectionSync: false,
      },
    );

    await waitFor(() => {
      expect(firstResult.current.ready).toBe(true);
    });

    const { result: secondResult } = renderFeatureHook(
      () =>
        useCollectionCacheReady({
          username: "testuser",
          enabled: true,
        }),
      {
        authInitialState: testAuthenticatedAuthState,
        includeCollectionSync: false,
      },
    );

    expect(secondResult.current.ready).toBe(true);
    expect(secondResult.current.hydratedFromCache).toBe(
      firstResult.current.hydratedFromCache,
    );
  });

  it("marks ready after prep completes even when the initiating hook unmounts", async () => {
    const { unmount } = renderFeatureHook(
      () =>
        useCollectionCacheReady({
          username: "testuser",
          enabled: true,
        }),
      {
        authInitialState: testAuthenticatedAuthState,
        includeCollectionSync: false,
      },
    );

    unmount();

    const { result: nextResult } = renderFeatureHook(
      () =>
        useCollectionCacheReady({
          username: "testuser",
          enabled: true,
        }),
      {
        authInitialState: testAuthenticatedAuthState,
        includeCollectionSync: false,
      },
    );

    await waitFor(() => {
      expect(nextResult.current.ready).toBe(true);
    });
  });

  it("resets when disabled", async () => {
    const { result, rerender } = renderFeatureHook(
      ({ enabled }: { enabled: boolean }) =>
        useCollectionCacheReady({
          username: "testuser",
          enabled,
        }),
      {
        initialProps: { enabled: true },
        authInitialState: testAuthenticatedAuthState,
        includeCollectionSync: false,
      },
    );

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });

    rerender({ enabled: false });

    expect(result.current).toEqual({
      ready: false,
      hydratedFromCache: false,
    });
  });
});
