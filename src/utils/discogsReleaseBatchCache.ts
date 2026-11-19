import type { QueryClient } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { RELEASE_BATCH_MAX_IDS } from "src/constants/collection";
import { discogsReleaseQueryOptions } from "src/hooks/queries/useDiscogsReleaseQuery";
import type { DiscogsRelease } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import { buildDiscogsReleaseDetailSeedFromPlaylistRelease } from "src/utils/discogsReleaseArt";

export const EMPTY_DISCOGS_RELEASE_DETAIL_MAP = new Map<
  string,
  DiscogsReleaseDetail
>();

export const normalizeDiscogsReleaseIds = (
  releaseIds: readonly string[],
): string[] => [...new Set(releaseIds.map(String))].sort();

export const chunkDiscogsReleaseIds = (releaseIds: string[]): string[][] => {
  if (releaseIds.length === 0) {
    return [];
  }

  const chunks: string[][] = [];

  for (
    let index = 0;
    index < releaseIds.length;
    index += RELEASE_BATCH_MAX_IDS
  ) {
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

export const seedDiscogsReleaseDetailCacheFromPlaylistReleases = (
  queryClient: QueryClient,
  playlistReleases: readonly DiscogsRelease[],
): void => {
  const seeds: Record<string, DiscogsReleaseDetail> = {};

  for (const release of playlistReleases) {
    const detail = buildDiscogsReleaseDetailSeedFromPlaylistRelease(release);

    if (!detail) {
      continue;
    }

    const releaseId = String(detail.id);

    if (
      queryClient.getQueryData(
        discogsReleaseQueryOptions(releaseId).queryKey,
      ) !== undefined
    ) {
      continue;
    }

    seeds[releaseId] = detail;
  }

  if (Object.keys(seeds).length === 0) {
    return;
  }

  seedDiscogsReleaseDetailCache(queryClient, seeds);
};

const seedDiscogsReleaseDetailCache = (
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

export const readDiscogsReleaseDetailFromCache = (
  queryClient: QueryClient,
  releaseId: string,
): DiscogsReleaseDetail | undefined =>
  queryClient.getQueryData<DiscogsReleaseDetail>(
    discogsReleaseQueryOptions(releaseId).queryKey,
  );

export const fetchDiscogsReleaseDetailsIntoCache = async (
  queryClient: QueryClient,
  releaseIds: readonly string[],
): Promise<void> => {
  const uniqueIds = normalizeDiscogsReleaseIds(releaseIds);
  const idsToFetch = getUncachedDiscogsReleaseIds(queryClient, uniqueIds);

  if (idsToFetch.length === 0) {
    return;
  }

  for (const chunk of chunkDiscogsReleaseIds(idsToFetch)) {
    const batchReleases = await api.discogsReleaseBatch(chunk);
    seedDiscogsReleaseDetailCache(queryClient, batchReleases ?? {});
  }
};
