import { beforeEach, describe, expect, it } from "@jest/globals";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiFetchError } from "src/api/apiFetchError";
import { api } from "src/api/urls";
import {
  COLLECTION_FIRST_PAGE_SIZE,
  COLLECTION_PAGE_SIZE,
} from "src/constants/collection";
import { AuthQueryKeys } from "src/hooks/queries/querykeys.constants";
import { useDiscogsCollectionQuery } from "src/hooks/queries/useDiscogsCollectionQuery";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { createTestQueryClient } from "src/tests/utils/testQueryClient";
import { persistCollectionItemCount } from "src/utils/collectionItemCountStorage";
import { renderHook, waitFor } from "test-utils";

jest.mock("src/api/urls", () => ({
  api: {
    checkAuth: jest.fn(),
    discogsCollection: jest.fn(),
  },
}));

const mockCheckAuth = jest.mocked(api.checkAuth);
const mockFetchDiscogsCollection = jest.mocked(api.discogsCollection);

describe("useDiscogsCollectionQuery", () => {
  let queryClient: QueryClient;

  const renderCollectionHook = () =>
    renderHook(
      () =>
        useDiscogsCollectionQuery({
          username: "testuser",
          enabled: true,
        }),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      },
    );

  beforeEach(() => {
    queryClient = createTestQueryClient();
    queryClient.setQueryDefaults(AuthQueryKeys.all(), { gcTime: 60_000 });
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("rechecks auth and retries once after a 401", async () => {
    const collection = collectionFactory.build({}, { totalItems: 100 });
    mockFetchDiscogsCollection
      .mockRejectedValueOnce(new ApiFetchError(401, "Not authenticated"))
      .mockResolvedValueOnce(collection);
    mockCheckAuth.mockResolvedValueOnce({
      isAuthenticated: true,
      username: "testuser",
      userId: "123",
      reconnectUsername: null,
      rateLimited: false,
    });

    const { result } = renderCollectionHook();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetchDiscogsCollection).toHaveBeenCalledTimes(2);
    expect(mockFetchDiscogsCollection).toHaveBeenCalledWith({
      username: "testuser",
      page: 1,
      perPage: COLLECTION_FIRST_PAGE_SIZE,
    });
    expect(mockCheckAuth).toHaveBeenCalledTimes(1);
    expect(result.current.data?.pages[0]).toEqual(collection);
  });

  it("starts at full page size when a large collection size is stored", async () => {
    persistCollectionItemCount("testuser", 11_400);
    const collection = collectionFactory.build(
      {},
      { page: 1, totalPages: 114, totalItems: 11_400 },
    );
    collection.pagination.per_page = COLLECTION_PAGE_SIZE;
    mockFetchDiscogsCollection.mockResolvedValueOnce(collection);

    const { result } = renderCollectionHook();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetchDiscogsCollection).toHaveBeenCalledTimes(1);
    expect(mockFetchDiscogsCollection).toHaveBeenCalledWith({
      username: "testuser",
      page: 1,
      perPage: COLLECTION_PAGE_SIZE,
    });
  });

  it("updates auth cache and fails when a 401 session is gone", async () => {
    mockFetchDiscogsCollection.mockRejectedValueOnce(
      new ApiFetchError(401, "Not authenticated"),
    );
    mockCheckAuth.mockResolvedValueOnce({
      isAuthenticated: false,
      username: null,
      userId: null,
      reconnectUsername: null,
      rateLimited: false,
    });

    const { result } = renderCollectionHook();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(mockFetchDiscogsCollection).toHaveBeenCalledTimes(1);
    expect(mockCheckAuth).toHaveBeenCalledTimes(1);
  });

  it("retries after a 503 without pausing pagination for auth revalidation", async () => {
    const collection = collectionFactory.build(
      {},
      { totalItems: 100, totalPages: 1 },
    );
    mockFetchDiscogsCollection
      .mockRejectedValueOnce(
        new ApiFetchError(
          503,
          "Discogs rate limit exceeded. Please try again shortly.",
          10,
        ),
      )
      .mockResolvedValueOnce(collection);

    const { result } = renderCollectionHook();

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 },
    );

    expect(mockFetchDiscogsCollection).toHaveBeenCalledTimes(2);
    expect(mockCheckAuth).not.toHaveBeenCalled();
  });
});
