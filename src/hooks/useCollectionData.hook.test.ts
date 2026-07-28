import { beforeEach, describe, expect, it } from "@jest/globals";
import { useAtomValue } from "jotai";
import { fetchDiscogsCollection } from "src/api/helpers";
import { allReleasesAtom } from "src/atoms/filters.atoms";
import {
  COLLECTION_FIRST_PAGE_SIZE,
  COLLECTION_PAGE_SIZE,
} from "src/constants/collection";
import { useCollectionContext } from "src/context/collection.context";
import { useCollectionData } from "src/hooks/useCollectionData.hook";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { act, renderFeatureHook, waitFor } from "test-utils";

jest.mock("src/api/helpers", () => ({
  fetchDiscogsCollection: jest.fn(),
}));

const mockFetchDiscogsCollection = jest.mocked(fetchDiscogsCollection);

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

describe("useCollectionData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads releases from the collection API into filter state", async () => {
    const page = buildSinglePageCollection(3);
    mockApiResponse(true, mockFetchDiscogsCollection, page, new Error("fail"));

    const { result } = renderFeatureHook(() => {
      useCollectionData({
        username: "testuser",
        isAuthenticated: true,
      });

      return useAtomValue(allReleasesAtom);
    });

    await waitFor(() => {
      expect(result.current).toHaveLength(3);
    });
  });

  it("does not reload releases when the collection response is unchanged", async () => {
    const page = buildSinglePageCollection(3);
    mockApiResponse(true, mockFetchDiscogsCollection, page, new Error("fail"));

    const { rerender, result } = renderFeatureHook(() => {
      useCollectionData({
        username: "testuser",
        isAuthenticated: true,
      });

      return useAtomValue(allReleasesAtom);
    });

    await waitFor(() => {
      expect(result.current).toHaveLength(3);
    });

    act(() => {
      rerender();
    });

    expect(result.current).toHaveLength(3);
    expect(mockFetchDiscogsCollection).toHaveBeenCalledTimes(1);
  });

  it("updates collection context when a later page replaces the bootstrap page", async () => {
    const bootstrap = buildBootstrapCollection(2);
    const fullPage = buildFullCollectionPage(4);

    mockFetchDiscogsCollection
      .mockResolvedValueOnce(bootstrap)
      .mockResolvedValue(fullPage);

    const { result } = renderFeatureHook(() => {
      useCollectionData({
        username: "testuser",
        isAuthenticated: true,
      });

      return useCollectionContext().state.collection;
    });

    await waitFor(() => {
      expect(result.current?.releases).toHaveLength(4);
    });
  });
});
