import "server-only";

import type { DiscogsThrottleCaller } from "src/constants/discogsThrottleCaller.constants";
import { runWithDiscogsThrottleCaller } from "src/lib/discogs-throttle-caller";
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

const fetchDiscogsReleaseRecordsSequentialInner = async ({
  releaseIds,
  useAuthenticatedSession,
  accessToken,
  accessTokenSecret,
}: Omit<FetchDiscogsReleaseRecordsSequentialParams, "throttleCaller">): Promise<
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

export const fetchDiscogsReleaseRecordsSequential = async (
  params: FetchDiscogsReleaseRecordsSequentialParams,
): Promise<Record<string, DiscogsReleaseDetail>> => {
  const { throttleCaller, ...rest } = params;

  if (throttleCaller) {
    return runWithDiscogsThrottleCaller(throttleCaller, () =>
      fetchDiscogsReleaseRecordsSequentialInner(rest),
    );
  }

  return fetchDiscogsReleaseRecordsSequentialInner(rest);
};
