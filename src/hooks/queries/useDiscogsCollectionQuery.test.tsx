import { beforeEach, describe, expect, it } from "@jest/globals";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiFetchError } from "src/api/apiFetchError";
import { checkAuth, fetchDiscogsCollection } from "src/api/helpers";
import { COLLECTION_FIRST_PAGE_SIZE } from "src/constants/collection";
import { AuthQueryKeys } from "src/hooks/queries/querykeys.constants";
import { useDiscogsCollectionQuery } from "src/hooks/queries/useDiscogsCollectionQuery";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { createTestQueryClient } from "src/tests/utils/testQueryClient";
import { renderHook, waitFor } from "test-utils";

jest.mock("src/api/helpers", () => ({
  checkAuth: jest.fn(),
  fetchDiscogsCollection: jest.fn(),
}));

const mockCheckAuth = jest.mocked(checkAuth);
const mockFetchDiscogsCollection = jest.mocked(fetchDiscogsCollection);

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
    jest.clearAllMocks();
  });

  it("rechecks auth and retries once after a 401", async () => {
    const collection = collectionFactory.build();
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
    expect(queryClient.getQueryData(AuthQueryKeys.all())).toEqual({
      isAuthenticated: true,
      username: "testuser",
      userId: "123",
      reconnectUsername: null,
      rateLimited: false,
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
    expect(queryClient.getQueryData(AuthQueryKeys.all())).toEqual({
      isAuthenticated: false,
      username: null,
      userId: null,
      reconnectUsername: null,
      rateLimited: false,
    });
  });
});
