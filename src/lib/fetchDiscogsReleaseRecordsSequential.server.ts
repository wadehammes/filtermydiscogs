import "server-only";

import { RELEASE_BATCH_MAX_DURATION_MS } from "src/constants/collection";
import type { DiscogsThrottleCaller } from "src/constants/discogsThrottleCaller.constants";
import { isDiscogsThrottleQueueError } from "src/lib/discogsThrottleQueueError";
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
  throttleCaller?: DiscogsThrottleCaller | undefined;
}

export const fetchDiscogsReleaseRecordsSequential = async ({
  releaseIds,
  useAuthenticatedSession,
  accessToken,
  accessTokenSecret,
  throttleCaller,
}: FetchDiscogsReleaseRecordsSequentialParams): Promise<
  Record<string, DiscogsReleaseDetail>
> => {
  const uniqueIds = [...new Set(releaseIds)];
  const releases: Record<string, DiscogsReleaseDetail> = {};
  const deadlineAt = Date.now() + RELEASE_BATCH_MAX_DURATION_MS;

  for (const releaseId of uniqueIds) {
    if (Date.now() >= deadlineAt) {
      break;
    }

    if (!isValidDiscogsReleaseIdParam(releaseId)) {
      continue;
    }

    const releaseUrl = `https://api.discogs.com/releases/${releaseId}`;

    try {
      const detail = await fetchDiscogsReleaseRecord({
        releaseUrl,
        useAuthenticatedSession,
        ...definedProps({ accessToken, accessTokenSecret, throttleCaller }),
      });

      releases[releaseId] = detail as DiscogsReleaseDetail;
    } catch (error) {
      if (isDiscogsThrottleQueueError(error)) {
        throw error;
      }
    }
  }

  return releases;
};
