import type { QueryClient } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { RELEASE_BATCH_MAX_IDS } from "src/constants/collection";
import { discogsReleaseQueryOptions } from "src/hooks/queries/useDiscogsReleaseQuery";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";

export const chunkDiscogsReleaseIds = (releaseIds: string[]): string[][] => {
  if (releaseIds.length === 0) {
    return [];
  }

  const chunks: string[][] = [];

  for (let index = 0; index < releaseIds.length; index += RELEASE_BATCH_MAX_IDS) {
    chunks.push(releaseIds.slice(index, index + RELEASE_BATCH_MAX_IDS));
  }

  return chunks;
};

export const getUncachedDiscogsReleaseIds = (
  queryClient: QueryClient,
  releaseIds: string[],
): string[] =>
  releaseIds.filter(
    (releaseId) =>
      queryClient.getQueryData(
        discogsReleaseQueryOptions(releaseId).queryKey,
      ) === undefined,
  );

export const seedDiscogsReleaseDetailCache = (
  queryClient: QueryClient,
  releases: Record<string, DiscogsReleaseDetail>,
): void => {
  for (const [releaseId, detail] of Object.entries(releases)) {
    queryClient.setQueryData(
      discogsReleaseQueryOptions(releaseId).queryKey,
      detail,
    );
  }
};

export const readDiscogsReleaseDetailsFromCache = (
  queryClient: QueryClient,
  releaseIds: string[],
): Map<string, DiscogsReleaseDetail> => {
  const map = new Map<string, DiscogsReleaseDetail>();

  for (const releaseId of releaseIds) {
    const detail = queryClient.getQueryData<DiscogsReleaseDetail>(
      discogsReleaseQueryOptions(releaseId).queryKey,
    );

    if (detail) {
      map.set(releaseId, detail);
    }
  }

  return map;
};

export const fetchDiscogsReleaseDetailsIntoCache = async (
  queryClient: QueryClient,
  releaseIds: string[],
): Promise<void> => {
  const uniqueIds = [...new Set(releaseIds)];
  const idsToFetch = getUncachedDiscogsReleaseIds(queryClient, uniqueIds);

  if (idsToFetch.length === 0) {
    return;
  }

  for (const chunk of chunkDiscogsReleaseIds(idsToFetch)) {
    const batchReleases = await api.discogsReleaseBatch(chunk);
    seedDiscogsReleaseDetailCache(queryClient, batchReleases ?? {});
  }
};
