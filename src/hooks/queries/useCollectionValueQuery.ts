import { useQuery } from "@tanstack/react-query";
import { fetchCollectionValue } from "src/api/helpers";
import type { CollectionValue } from "src/types/dashboard.types";
import { CollectionValueQueryKeys } from "./querykeys.constants";

export interface UseCollectionValueQueryParams {
  username: string | null;
}

export const useCollectionValueQuery = ({
  username,
}: UseCollectionValueQueryParams) => {
  return useQuery<CollectionValue>({
    queryKey: CollectionValueQueryKeys.byUsername(username),
    queryFn: async () => {
      if (!username) {
        throw new Error("Username is required");
      }

      const data = await fetchCollectionValue(username);

      if (
        !data ||
        typeof data.minimum !== "number" ||
        typeof data.median !== "number" ||
        typeof data.maximum !== "number"
      ) {
        throw new Error("Invalid collection value data received");
      }

      return data;
    },
    enabled: !!username,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
};
