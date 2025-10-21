import { useQuery } from "@tanstack/react-query";
import { fetchDiscogsSearch } from "src/api/helpers";
import type { DiscogsSearchResponse, SearchParams } from "src/types";

interface UseDiscogsSearchQueryParams extends Omit<SearchParams, "query"> {
  query: string;
  enabled?: boolean;
}

export const useDiscogsSearchQuery = ({
  query,
  enabled = false,
  page = 1,
  perPage = 100,
  type = "release",
  format,
  year,
  genre,
  style,
}: UseDiscogsSearchQueryParams) => {
  return useQuery<DiscogsSearchResponse>({
    queryKey: [
      "discogsSearch",
      query,
      page,
      perPage,
      type,
      format,
      year,
      genre,
      style,
    ],
    queryFn: () => {
      return fetchDiscogsSearch(
        query,
        page,
        perPage,
        type,
        format,
        year,
        genre,
        style,
      );
    },
    enabled: enabled && !!query.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes - search results can be cached briefly
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in memory
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
