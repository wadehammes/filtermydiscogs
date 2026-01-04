import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchDiscogsCollection } from "src/api/helpers";
import type { DiscogsCollection } from "src/types";

export const useDiscogsCollectionQuery = (
  username: string,
  enabled: boolean = false,
) => {
  return useInfiniteQuery({
    queryKey: ["discogsCollection", username],
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
    staleTime: 10 * 60 * 1000, // 10 minutes - collection data doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in memory longer
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch if data is fresh
    refetchOnReconnect: false, // Don't refetch on reconnect if data is fresh
  });
};
