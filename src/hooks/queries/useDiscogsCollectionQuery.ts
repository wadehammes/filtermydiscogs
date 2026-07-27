import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { ApiFetchError } from "src/api/apiFetchError";
import { checkAuth, fetchDiscogsCollection } from "src/api/helpers";
import { normalizeAuthStatus } from "src/services/auth.service";
import type { DiscogsCollection } from "src/types";
import {
  COLLECTION_BOOTSTRAP_PAGE_PARAM,
  type CollectionPageParam,
  getNextCollectionPageParam,
} from "src/utils/collectionPagination";
import {
  AuthQueryKeys,
  DiscogsCollectionQueryKeys,
} from "./querykeys.constants";

export interface UseDiscogsCollectionQueryParams {
  username: string;
  enabled?: boolean;
}

export const useDiscogsCollectionQuery = ({
  username,
  enabled = false,
}: UseDiscogsCollectionQueryParams) => {
  const queryClient = useQueryClient();

  return useInfiniteQuery({
    queryKey: DiscogsCollectionQueryKeys.byUsername(username),
    queryFn: async ({ pageParam }) => {
      const { page, perPage } = pageParam as CollectionPageParam;

      try {
        return await fetchDiscogsCollection({ username, page, perPage });
      } catch (error) {
        if (!(error instanceof ApiFetchError) || error.status !== 401) {
          throw error;
        }

        const authStatus = normalizeAuthStatus(await checkAuth());
        queryClient.setQueryData(AuthQueryKeys.all(), authStatus);

        if (!(authStatus.isAuthenticated && authStatus.username)) {
          throw error;
        }

        return fetchDiscogsCollection({ username, page, perPage });
      }
    },
    getNextPageParam: (
      lastPage: DiscogsCollection,
      allPages: DiscogsCollection[],
    ) => getNextCollectionPageParam({ lastPage, allPages }),
    initialPageParam: COLLECTION_BOOTSTRAP_PAGE_PARAM,
    enabled: enabled && !!username,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
