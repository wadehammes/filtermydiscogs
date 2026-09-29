import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
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
    isPending: isReleaseDetailPending,
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

    const releaseQuery = discogsReleaseQueryOptions(releaseIdString);

    const ensureReleaseDetail = () => {
      void queryClient.ensureQueryData(releaseQuery).catch(() => undefined);
    };

    if (queryClient.getQueryData(releaseQuery.queryKey) === undefined) {
      ensureReleaseDetail();
    }

    return queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== "removed") {
        return;
      }

      const [removedKeyPrefix, removedReleaseId] = event.query.queryKey;

      if (
        removedKeyPrefix === releaseQuery.queryKey[0] &&
        removedReleaseId === releaseQuery.queryKey[1]
      ) {
        ensureReleaseDetail();
      }
    });
  }, [queryClient, enabled, releaseIdString]);

  const isLoading =
    enabled &&
    !isError &&
    releaseDetail === undefined &&
    isReleaseDetailPending;

  return {
    releaseDetail,
    isLoading,
    isError,
    refetch,
  };
};
