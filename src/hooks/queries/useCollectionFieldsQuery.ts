import { useQuery } from "@tanstack/react-query";
import { fetchCollectionFields } from "src/api/helpers";
import { CollectionFieldsQueryKeys } from "./querykeys.constants";

export interface UseCollectionFieldsQueryParams {
  username: string;
  enabled?: boolean;
}

export const useCollectionFieldsQuery = ({
  username,
  enabled = false,
}: UseCollectionFieldsQueryParams) => {
  return useQuery({
    queryKey: CollectionFieldsQueryKeys.byUsername(username),
    queryFn: () => fetchCollectionFields(username),
    enabled: enabled && !!username,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
