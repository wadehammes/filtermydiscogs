import "server-only";

import { logSanitizedApiRouteFailure } from "src/lib/api-helpers";
import { parseDiscogsProfileEmail } from "src/lib/discogs-profile-email";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export type DiscogsProfileEmailCredentials = {
  username: string;
  accessToken: string;
  accessTokenSecret: string;
};

export const fetchDiscogsProfileEmailForLogin = async (
  credentials: DiscogsProfileEmailCredentials,
  routeLabel: string,
): Promise<string | null> => {
  try {
    const profile = await discogsOAuthService.getUserProfile(
      credentials.username,
      credentials.accessToken,
      credentials.accessTokenSecret,
      { skipThrottle: true },
    );

    return parseDiscogsProfileEmail(profile);
  } catch (error) {
    logSanitizedApiRouteFailure(
      routeLabel,
      error,
      "Discogs profile email fetch failed:",
    );
    return null;
  }
};
