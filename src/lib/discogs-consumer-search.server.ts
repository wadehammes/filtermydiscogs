import "server-only";

import { discogsOAuthService } from "src/services/discogs-oauth.service";
import type { DiscogsSearchResponse } from "src/types";

export const searchDiscogsDatabase = async (
  params: Record<string, string>,
): Promise<DiscogsSearchResponse | null> => {
  const url = new URL("https://api.discogs.com/database/search");

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  try {
    return (await discogsOAuthService.makeConsumerRequest(
      url.toString(),
      "GET",
    )) as DiscogsSearchResponse;
  } catch {
    return null;
  }
};
