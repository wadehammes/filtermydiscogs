import { useQuery } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { BuildVersionQueryKeys } from "src/hooks/queries/querykeys.constants";
import { buildVersionRefetchIntervalMs } from "src/utils/deploymentBuildVersionPolling";

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
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: () => buildVersionRefetchIntervalMs(enabled),
    refetchIntervalInBackground: false,
  });
