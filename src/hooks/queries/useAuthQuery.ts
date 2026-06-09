import { useQuery } from "@tanstack/react-query";
import { checkAuth } from "src/api/helpers";
import { AuthQueryKeys } from "src/hooks/queries/querykeys.constants";
import type { AuthStatus } from "src/services/auth.service";

export interface UseAuthQueryParams {
  enabled?: boolean;
}

const normalizeAuthStatus = (data: {
  isAuthenticated: boolean;
  username: string | null;
  userId: string | null;
  rateLimited?: boolean;
}): AuthStatus => ({
  isAuthenticated: data.isAuthenticated,
  username: data.username || null,
  userId: data.userId || null,
  rateLimited: data.rateLimited === true,
});

export const useAuthQuery = ({ enabled = true }: UseAuthQueryParams = {}) => {
  return useQuery<AuthStatus>({
    queryKey: AuthQueryKeys.all(),
    queryFn: async () => {
      const data = await checkAuth();
      return normalizeAuthStatus(data);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    refetchOnWindowFocus: (query) => query.state.data?.rateLimited === true,
    refetchInterval: (query) =>
      query.state.data?.rateLimited === true ? 60_000 : false,
  });
};
