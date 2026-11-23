import { useQuery } from "@tanstack/react-query";
import { api } from "src/api/urls";
import type { AdminWelcomeEmailPendingResponse } from "src/types/adminWelcomeEmail.types";
import { AdminWelcomeEmailPendingQueryKeys } from "./querykeys.constants";

export const useAdminWelcomeEmailPendingQuery = (enabled: boolean) => {
  return useQuery<AdminWelcomeEmailPendingResponse>({
    queryKey: AdminWelcomeEmailPendingQueryKeys.all(),
    queryFn: () => api.adminWelcomeEmailPending(),
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: false,
  });
};
