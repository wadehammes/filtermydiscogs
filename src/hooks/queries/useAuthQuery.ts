import { useQuery } from "@tanstack/react-query";
import { AuthQueryKeys } from "src/hooks/queries/querykeys.constants";
import { type AuthStatus, checkAuthStatus } from "src/services/auth.service";

export interface UseAuthQueryParams {
  enabled?: boolean;
}

export const useAuthQuery = ({ enabled = true }: UseAuthQueryParams = {}) => {
  return useQuery<AuthStatus>({
    queryKey: AuthQueryKeys.all(),
    queryFn: checkAuthStatus,
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    refetchOnMount: "always",
    refetchOnReconnect: false,
    refetchOnWindowFocus: (query) => query.state.data?.rateLimited === true,
    refetchInterval: (query) =>
      query.state.data?.rateLimited === true ? 60_000 : false,
  });
};
