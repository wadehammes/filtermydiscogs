import { useQuery } from "@tanstack/react-query";
import { api } from "src/api/urls";
import type { AdminStats } from "src/types/dashboard.types";
import { AdminStatsQueryKeys } from "./querykeys.constants";

export type { AdminStats } from "src/types/dashboard.types";

export const useAdminStatsQuery = () => {
  return useQuery<AdminStats>({
    queryKey: AdminStatsQueryKeys.all(),
    queryFn: api.adminStats,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    retry: 1,
  });
};
