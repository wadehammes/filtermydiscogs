import { beforeEach, describe, expect, it } from "@jest/globals";
import type { InfiniteData } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { useSaveReleaseRatingMutation } from "src/hooks/mutations/useCollectionMutations";
import { DiscogsCollectionQueryKeys } from "src/hooks/queries/querykeys.constants";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import {
  installMockIndexedDb,
  resetMockIndexedDb,
} from "src/tests/mocks/mockIndexedDb";
import { createTestQueryClient } from "src/tests/utils/testQueryClient";
import type { DiscogsCollection } from "src/types";
import {
  COLLECTION_FULL_PAGE_PARAM,
  type CollectionPageParam,
} from "src/utils/collectionPagination";
import { act, renderFeatureHook } from "test-utils";

jest.mock("src/api/urls", () => ({
  api: {
    updateReleaseRating: jest.fn(),
    clearReleaseRating: jest.fn(),
  },
}));

jest.mock("src/analytics/productAnalyticsEvents", () => ({
  trackReleaseRatingSaved: jest.fn(),
}));

const mockUpdateReleaseRating = jest.mocked(api.updateReleaseRating);
const apiError = new Error("API request failed");

const USERNAME = "testuser";
const RELEASE_ID = 34703520;

describe("useSaveReleaseRatingMutation", () => {
  beforeEach(() => {
    resetMockIndexedDb();
    installMockIndexedDb();
    jest.clearAllMocks();
  });

  it("keeps the patched collection cache without invalidating it on success", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const release = releaseFactory.withResourceUrl(RELEASE_ID, { rating: 3 });
    const page = collectionFactory.build(
      {},
      { releaseCount: 1, totalPages: 1 },
    );
    page.releases = [release];

    const collectionQueryKey = DiscogsCollectionQueryKeys.byUsername(USERNAME);
    const initialData: InfiniteData<DiscogsCollection, CollectionPageParam> = {
      pages: [page],
      pageParams: [COLLECTION_FULL_PAGE_PARAM],
    };

    queryClient.setQueryData(collectionQueryKey, initialData);

    mockApiResponse(
      true,
      mockUpdateReleaseRating,
      {
        username: USERNAME,
        release_id: RELEASE_ID,
        rating: 5,
      },
      apiError,
    );

    const { result } = renderFeatureHook(
      () => useSaveReleaseRatingMutation({ username: USERNAME }),
      { queryClient },
    );

    await act(async () => {
      await result.current.mutateAsync({
        releaseId: RELEASE_ID,
        instanceId: String(release.instance_id),
        nextRating: 5,
        shouldClear: false,
      });
    });

    const updated =
      queryClient.getQueryData<
        InfiniteData<DiscogsCollection, CollectionPageParam>
      >(collectionQueryKey);

    expect(updated?.pages[0]?.releases[0]?.rating).toBe(5);
    expect(invalidateSpy).not.toHaveBeenCalled();

    invalidateSpy.mockRestore();
  });
});
