import "server-only";

import { logSanitizedApiRouteFailure } from "src/lib/api-helpers";
import { parseDiscogsProfileEmail } from "src/lib/discogs-profile-email";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export type DiscogsProfileEmailCredentials = {
  username: string;
  accessToken: string;
  accessTokenSecret: string;
};

export const fetchDiscogsProfileEmail = async ({
  username,
  accessToken,
  accessTokenSecret,
}: DiscogsProfileEmailCredentials): Promise<string | null> => {
  const profile = await discogsOAuthService.getUserProfile(
    username,
    accessToken,
    accessTokenSecret,
  );

  return parseDiscogsProfileEmail(profile);
};

export const fetchDiscogsProfileEmailForLogin = async (
  credentials: DiscogsProfileEmailCredentials,
  routeLabel: string,
): Promise<string | null> => {
  try {
    return await fetchDiscogsProfileEmail(credentials);
  } catch (error) {
    logSanitizedApiRouteFailure(
      routeLabel,
      error,
      "Discogs profile email fetch failed:",
    );
    return null;
  }
};
