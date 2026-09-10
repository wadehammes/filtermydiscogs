import type { NextRequest } from "next/server";
import type { VerifiedDiscogsUser } from "src/lib/auth-request";
import {
  getCachedUserAvatarUrl,
  getInFlightAvatarRequest,
  setCachedUserAvatarUrl,
  setInFlightAvatarRequest,
} from "src/lib/user-profile-cache";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export async function resolveDiscogsAvatarUrl(
  request: NextRequest,
  user: VerifiedDiscogsUser,
): Promise<string | null> {
  const cached = getCachedUserAvatarUrl(user.userId);
  if (cached !== undefined) {
    return cached;
  }

  const inFlight = getInFlightAvatarRequest(user.userId);
  if (inFlight) {
    return inFlight;
  }

  const requestPromise = fetchDiscogsAvatarUrl(request, user);
  setInFlightAvatarRequest(user.userId, requestPromise);
  return requestPromise;
}

async function fetchDiscogsAvatarUrl(
  request: NextRequest,
  user: VerifiedDiscogsUser,
): Promise<string | null> {
  const accessToken = request.cookies.get("discogs_access_token")?.value;
  const accessTokenSecret = request.cookies.get(
    "discogs_access_token_secret",
  )?.value;

  if (!(accessToken && accessTokenSecret)) {
    return null;
  }

  try {
    const profile = await discogsOAuthService.getUserProfile(
      user.username,
      accessToken,
      accessTokenSecret,
    );
    const avatarUrl = profile.avatar_url?.trim() || null;
    setCachedUserAvatarUrl(user.userId, avatarUrl);
    return avatarUrl;
  } catch (error) {
    console.error("Discogs user profile fetch failed:", error);
    return null;
  }
}
