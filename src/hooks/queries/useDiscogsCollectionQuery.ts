import {
  type QueryClient,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ApiFetchError,
  getRateLimitedRetryDelayMs,
  isTransientRateLimitError,
} from "src/api/apiFetchError";
import { checkAuth, fetchDiscogsCollection } from "src/api/helpers";
import {
  COLLECTION_CACHE_STALE_MS,
  COLLECTION_FIRST_PAGE_SIZE,
} from "src/constants/collection";
import { normalizeAuthStatus } from "src/services/auth.service";
import type { DiscogsCollection } from "src/types";
import { persistCollectionItemCount } from "src/utils/collectionItemCountStorage";
import {
  COLLECTION_FULL_PAGE_PARAM,
  type CollectionPageParam,
  getInitialCollectionPageParam,
  getNextCollectionPageParam,
  shouldSkipCollectionBootstrap,
} from "src/utils/collectionPagination";
import {
  AuthQueryKeys,
  DiscogsCollectionQueryKeys,
} from "./querykeys.constants";

export interface UseDiscogsCollectionQueryParams {
  username: string;
  enabled?: boolean;
}

const COLLECTION_RATE_LIMIT_MAX_RETRIES = 3;

async function syncAuthQueryCache(queryClient: QueryClient) {
  const authStatus = normalizeAuthStatus(await checkAuth());
  queryClient.setQueryData(AuthQueryKeys.all(), authStatus);
  return authStatus;
}

async function fetchCollectionPage({
  username,
  pageParam,
  queryClient,
}: {
  username: string;
  pageParam: CollectionPageParam;
  queryClient: QueryClient;
}): Promise<DiscogsCollection> {
  const { page, perPage } = pageParam;

  try {
    return await fetchDiscogsCollection({ username, page, perPage });
  } catch (error) {
    if (!(error instanceof ApiFetchError) || error.status !== 401) {
      throw error;
    }

    const authStatus = await syncAuthQueryCache(queryClient);

    if (!(authStatus.isAuthenticated && authStatus.username)) {
      throw error;
    }

    return fetchDiscogsCollection({ username, page, perPage });
  }
}

async function fetchCollectionPageWithBootstrapSkip({
  username,
  pageParam,
  queryClient,
}: {
  username: string;
  pageParam: CollectionPageParam;
  queryClient: QueryClient;
}): Promise<DiscogsCollection> {
  const collection = await fetchCollectionPage({
    username,
    pageParam,
    queryClient,
  });

  persistCollectionItemCount(username, collection.pagination.items);

  if (
    pageParam.perPage === COLLECTION_FIRST_PAGE_SIZE &&
    shouldSkipCollectionBootstrap(collection.pagination.items)
  ) {
    return fetchCollectionPage({
      username,
      pageParam: COLLECTION_FULL_PAGE_PARAM,
      queryClient,
    });
  }

  return collection;
}

export const useDiscogsCollectionQuery = ({
  username,
  enabled = false,
}: UseDiscogsCollectionQueryParams) => {
  const queryClient = useQueryClient();

  return useInfiniteQuery({
    queryKey: DiscogsCollectionQueryKeys.byUsername(username),
    queryFn: ({ pageParam }) =>
      fetchCollectionPageWithBootstrapSkip({
        username,
        pageParam: pageParam as CollectionPageParam,
        queryClient,
      }),
    getNextPageParam: (
      lastPage: DiscogsCollection,
      allPages: DiscogsCollection[],
    ) => getNextCollectionPageParam({ lastPage, allPages }),
    initialPageParam: getInitialCollectionPageParam(username),
    enabled: enabled && !!username,
    staleTime: COLLECTION_CACHE_STALE_MS,
    gcTime: COLLECTION_CACHE_STALE_MS,
    retry: (failureCount, error) =>
      isTransientRateLimitError(error) &&
      failureCount < COLLECTION_RATE_LIMIT_MAX_RETRIES,
    retryDelay: (attemptIndex, error) =>
      getRateLimitedRetryDelayMs(error, attemptIndex),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
