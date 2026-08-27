import { useQuery } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { BuildVersionQueryKeys } from "src/hooks/queries/querykeys.constants";
import { DEPLOYMENT_UPDATE_POLL_INTERVAL_MS } from "src/utils/appBuildVersion";

export interface UseBuildVersionQueryParams {
  enabled?: boolean;
}

export const useBuildVersionQuery = ({
  enabled = true,
}: UseBuildVersionQueryParams = {}) =>
  useQuery({
    queryKey: BuildVersionQueryKeys.all(),
    queryFn: api.buildVersion,
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: true,
    refetchInterval: enabled ? DEPLOYMENT_UPDATE_POLL_INTERVAL_MS : false,
  });
