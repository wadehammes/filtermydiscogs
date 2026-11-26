import "server-only";

import { RELEASE_BATCH_MAX_DURATION_MS } from "src/constants/collection";
import type { DiscogsThrottleCaller } from "src/constants/discogsThrottleCaller.constants";
import {
  runPacedDiscogsRequestInActiveSlot,
  runThrottledDiscogsRequest,
} from "src/lib/discogs-request-throttle";
import { runWithDiscogsThrottleCaller } from "src/lib/discogs-throttle-caller";
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

const fetchDiscogsReleaseRecordsSequentialInner = async (
  {
    releaseIds,
    useAuthenticatedSession,
    accessToken,
    accessTokenSecret,
  }: Omit<FetchDiscogsReleaseRecordsSequentialParams, "throttleCaller">,
  {
    deadlineAt,
    pacedInThrottleSlot,
  }: {
    deadlineAt: number;
    pacedInThrottleSlot: boolean;
  },
): Promise<Record<string, DiscogsReleaseDetail>> => {
  const uniqueIds = [...new Set(releaseIds)];
  const releases: Record<string, DiscogsReleaseDetail> = {};

  for (const releaseId of uniqueIds) {
    if (Date.now() >= deadlineAt) {
      break;
    }

    if (!isValidDiscogsReleaseIdParam(releaseId)) {
      continue;
    }

    const releaseUrl = `https://api.discogs.com/releases/${releaseId}`;

    const fetchOne = () =>
      fetchDiscogsReleaseRecord({
        releaseUrl,
        useAuthenticatedSession,
        skipDiscogsThrottle: pacedInThrottleSlot,
        ...definedProps({ accessToken, accessTokenSecret }),
      });

    try {
      const detail = pacedInThrottleSlot
        ? await runPacedDiscogsRequestInActiveSlot(fetchOne)
        : await fetchOne();

      releases[releaseId] = detail as DiscogsReleaseDetail;
    } catch (error) {
      if (isDiscogsThrottleQueueError(error)) {
        throw error;
      }
    }
  }

  return releases;
};

export const fetchDiscogsReleaseRecordsSequential = async (
  params: FetchDiscogsReleaseRecordsSequentialParams,
): Promise<Record<string, DiscogsReleaseDetail>> => {
  const { throttleCaller, ...rest } = params;
  const deadlineAt = Date.now() + RELEASE_BATCH_MAX_DURATION_MS;
  const pacedInThrottleSlot = throttleCaller !== undefined;
  const innerOptions = { deadlineAt, pacedInThrottleSlot };

  if (throttleCaller) {
    return runWithDiscogsThrottleCaller(throttleCaller, () =>
      runThrottledDiscogsRequest(() =>
        fetchDiscogsReleaseRecordsSequentialInner(rest, innerOptions),
      ),
    );
  }

  return fetchDiscogsReleaseRecordsSequentialInner(rest, innerOptions);
};
