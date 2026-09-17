import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { DiscogsReleaseQueryKeys } from "src/hooks/queries/querykeys.constants";
import {
  discogsReleaseQueryOptions,
  useDiscogsReleaseQuery,
} from "src/hooks/queries/useDiscogsReleaseQuery";

interface UseReleaseModalReleaseDetailQueryParams {
  releaseIdString: string;
  enabled: boolean;
}

export const useReleaseModalReleaseDetailQuery = ({
  releaseIdString,
  enabled,
}: UseReleaseModalReleaseDetailQueryParams) => {
  const queryClient = useQueryClient();

  const {
    data: releaseDetail,
    isLoading: isReleaseDetailLoading,
    isError,
    refetch,
  } = useDiscogsReleaseQuery({
    releaseId: releaseIdString,
    enabled,
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const releaseQueryKey = DiscogsReleaseQueryKeys.byId(releaseIdString);

    const ensureReleaseDetail = () => {
      void queryClient
        .ensureQueryData(discogsReleaseQueryOptions(releaseIdString))
        .catch(() => undefined);
    };

    if (queryClient.getQueryData(releaseQueryKey) === undefined) {
      ensureReleaseDetail();
    }

    return queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== "removed") {
        return;
      }

      const [removedKeyPrefix, removedReleaseId] = event.query.queryKey;

      if (
        removedKeyPrefix === releaseQueryKey[0] &&
        removedReleaseId === releaseQueryKey[1]
      ) {
        ensureReleaseDetail();
      }
    });
  }, [queryClient, enabled, releaseIdString]);

  const isLoading =
    enabled &&
    !isError &&
    releaseDetail === undefined &&
    isReleaseDetailLoading;

  return {
    releaseDetail,
    isLoading,
    isError,
    refetch,
  };
};
