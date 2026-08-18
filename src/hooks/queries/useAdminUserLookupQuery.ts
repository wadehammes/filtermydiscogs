import { useQuery } from "@tanstack/react-query";
import { fetchAdminUserLookup } from "src/api/helpers";
import type { AdminUserLookupStats } from "src/types/adminUserLookup.types";
import { AdminUserLookupQueryKeys } from "./querykeys.constants";

export const useAdminUserLookupQuery = (username: string | null) => {
  return useQuery<AdminUserLookupStats>({
    queryKey: AdminUserLookupQueryKeys.byUsername(username),
    queryFn: () => fetchAdminUserLookup(username as string),
    enabled: Boolean(username),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
};
