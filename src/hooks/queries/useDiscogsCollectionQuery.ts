import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchDiscogsCollection } from "src/api/helpers";
import type { DiscogsCollection } from "src/types";
import { DiscogsCollectionQueryKeys } from "./querykeys.constants";

export interface UseDiscogsCollectionQueryParams {
  username: string;
  enabled?: boolean;
}

export const useDiscogsCollectionQuery = ({
  username,
  enabled = false,
}: UseDiscogsCollectionQueryParams) => {
  return useInfiniteQuery({
    queryKey: DiscogsCollectionQueryKeys.byUsername(username),
    queryFn: ({ pageParam = 1 }) => {
      return fetchDiscogsCollection(username, pageParam as number);
    },
    getNextPageParam: (lastPage: DiscogsCollection) => {
      if (lastPage.pagination?.urls?.next) {
        const url = new URL(lastPage.pagination.urls.next);
        const pageParam = url.searchParams.get("page");

        return pageParam ? parseInt(pageParam, 10) : undefined;
      }

      return undefined;
    },
    initialPageParam: 1,
    enabled: enabled && !!username,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
