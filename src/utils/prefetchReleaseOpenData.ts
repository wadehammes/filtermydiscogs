import type { QueryClient } from "@tanstack/react-query";
import { prefetchReleaseModal } from "src/components/ReleaseModal/prefetchReleaseModal";
import { DiscogsReleaseQueryKeys } from "src/hooks/queries/querykeys.constants";
import { discogsReleaseQueryOptions } from "src/hooks/queries/useDiscogsReleaseQuery";
import type { DiscogsRelease } from "src/types";
import { parseReleaseId } from "src/utils/releaseNotes";

export const prefetchReleaseOpenData = (
  queryClient: QueryClient,
  release: DiscogsRelease,
): void => {
  prefetchReleaseModal();

  const releaseId = parseReleaseId(release);
  if (releaseId === null) {
    return;
  }

  const releaseQueryKey = DiscogsReleaseQueryKeys.byId(String(releaseId));
  const queryState = queryClient.getQueryState(releaseQueryKey);

  if (queryState?.fetchStatus === "fetching") {
    return;
  }

  if (queryClient.getQueryData(releaseQueryKey) === undefined) {
    void queryClient.prefetchQuery(
      discogsReleaseQueryOptions(String(releaseId)),
    );
  }
};
