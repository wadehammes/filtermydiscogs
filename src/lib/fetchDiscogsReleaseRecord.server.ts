import "server-only";

import { getDiscogsApiErrorStatus } from "src/lib/discogs-api-error";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export interface FetchDiscogsReleaseRecordParams {
  releaseUrl: string;
  useAuthenticatedSession: boolean;
  accessToken?: string | undefined;
  accessTokenSecret?: string | undefined;
}

export const fetchDiscogsReleaseRecord = async ({
  releaseUrl,
  useAuthenticatedSession,
  accessToken,
  accessTokenSecret,
}: FetchDiscogsReleaseRecordParams): Promise<unknown> => {
  if (useAuthenticatedSession && accessToken && accessTokenSecret) {
    try {
      return await discogsOAuthService.makeAuthenticatedRequest(
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

  return discogsOAuthService.makeConsumerRequest(releaseUrl, "GET");
};
