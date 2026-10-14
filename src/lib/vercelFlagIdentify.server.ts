import type { ReadonlyRequestCookies } from "flags";
import { dedupe } from "flags/next";

export type VercelFlagEntities = {
  user?: {
    id: string;
    discogsUserId: string;
    username: string;
  };
};

export const buildVercelFlagEntitiesFromDiscogsCookies = (
  userId: string | undefined,
  username: string | undefined,
): VercelFlagEntities => {
  if (!(userId && username)) {
    return {};
  }

  return {
    user: {
      id: userId,
      discogsUserId: userId,
      username: username.toLowerCase(),
    },
  };
};

export const vercelFlagIdentify = dedupe(
  async ({
    cookies: cookieJar,
  }: {
    cookies: ReadonlyRequestCookies;
  }): Promise<VercelFlagEntities> =>
    buildVercelFlagEntitiesFromDiscogsCookies(
      cookieJar.get("discogs_user_id")?.value,
      cookieJar.get("discogs_username")?.value,
    ),
);
