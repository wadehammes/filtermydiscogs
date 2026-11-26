import "server-only";

import type { DiscogsThrottleCaller } from "src/constants/discogsThrottleCaller.constants";
import { getDiscogsApiErrorStatus } from "src/lib/discogs-api-error";
import { runWithDiscogsThrottleCaller } from "src/lib/discogs-throttle-caller";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export interface FetchDiscogsReleaseRecordParams {
  releaseUrl: string;
  useAuthenticatedSession: boolean;
  accessToken?: string | undefined;
  accessTokenSecret?: string | undefined;
  throttleCaller?: DiscogsThrottleCaller | undefined;
  skipDiscogsThrottle?: boolean | undefined;
}

const fetchDiscogsReleaseRecordInner = async ({
  releaseUrl,
  useAuthenticatedSession,
  accessToken,
  accessTokenSecret,
  skipDiscogsThrottle,
}: Omit<
  FetchDiscogsReleaseRecordParams,
  "throttleCaller"
>): Promise<unknown> => {
  if (useAuthenticatedSession && accessToken && accessTokenSecret) {
    try {
      return skipDiscogsThrottle
        ? await discogsOAuthService.makeAuthenticatedRequest(
            releaseUrl,
            "GET",
            accessToken,
            accessTokenSecret,
            {},
            { skipThrottle: true },
          )
        : await discogsOAuthService.makeAuthenticatedRequest(
            releaseUrl,
            "GET",
            accessToken,
            accessTokenSecret,
          );
    } catch (error) {
      if (getDiscogsApiErrorStatus(error) !== 404) {
        throw error;
      }
    }
  }

  return skipDiscogsThrottle
    ? discogsOAuthService.makeConsumerRequest(releaseUrl, "GET", {
        skipThrottle: true,
      })
    : discogsOAuthService.makeConsumerRequest(releaseUrl, "GET");
};

export const fetchDiscogsReleaseRecord = async (
  params: FetchDiscogsReleaseRecordParams,
): Promise<unknown> => {
  const { throttleCaller, ...rest } = params;

  if (throttleCaller) {
    return runWithDiscogsThrottleCaller(throttleCaller, () =>
      fetchDiscogsReleaseRecordInner(rest),
    );
  }

  return fetchDiscogsReleaseRecordInner(rest);
};
