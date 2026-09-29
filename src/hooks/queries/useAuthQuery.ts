import { queryOptions, useQuery } from "@tanstack/react-query";
import { AuthQueryKeys } from "src/hooks/queries/querykeys.constants";
import { type AuthStatus, checkAuthStatus } from "src/services/auth.service";

const AUTH_STALE_MS = 5 * 60 * 1000;
const AUTH_GC_MS = 10 * 60 * 1000;

export const authQueryOptions = () =>
  queryOptions<AuthStatus>({
    queryKey: AuthQueryKeys.all(),
    queryFn: checkAuthStatus,
    staleTime: AUTH_STALE_MS,
    gcTime: AUTH_GC_MS,
    retry: false,
    refetchOnMount: "always",
    refetchOnReconnect: false,
    refetchOnWindowFocus: (query) => query.state.data?.rateLimited === true,
    refetchInterval: (query) =>
      query.state.data?.rateLimited === true ? 60_000 : false,
  });

export interface UseAuthQueryParams {
  enabled?: boolean;
}

export const useAuthQuery = ({ enabled = true }: UseAuthQueryParams = {}) => {
  return useQuery<AuthStatus>({
    ...authQueryOptions(),
    enabled,
  });
};
