import "server-only";

import { fetchDiscogsReleaseRecord } from "src/lib/fetchDiscogsReleaseRecord.server";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import { definedProps } from "src/utils/definedProps";

export const isValidDiscogsReleaseIdParam = (releaseId: string): boolean =>
  /^\d+$/.test(releaseId) && releaseId.length <= 10;

export interface FetchDiscogsReleaseRecordsSequentialParams {
  releaseIds: readonly string[];
  useAuthenticatedSession: boolean;
  accessToken?: string | undefined;
  accessTokenSecret?: string | undefined;
}

export const fetchDiscogsReleaseRecordsSequential = async ({
  releaseIds,
  useAuthenticatedSession,
  accessToken,
  accessTokenSecret,
}: FetchDiscogsReleaseRecordsSequentialParams): Promise<
  Record<string, DiscogsReleaseDetail>
> => {
  const uniqueIds = [...new Set(releaseIds)];
  const releases: Record<string, DiscogsReleaseDetail> = {};

  for (const releaseId of uniqueIds) {
    if (!isValidDiscogsReleaseIdParam(releaseId)) {
      continue;
    }

    const releaseUrl = `https://api.discogs.com/releases/${releaseId}`;

    try {
      releases[releaseId] = (await fetchDiscogsReleaseRecord({
        releaseUrl,
        useAuthenticatedSession,
        ...definedProps({ accessToken, accessTokenSecret }),
      })) as DiscogsReleaseDetail;
    } catch {}
  }

  return releases;
};
