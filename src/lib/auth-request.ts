import type { NextRequest, NextResponse } from "next/server";
import {
  type CachedDiscogsIdentity,
  clearCachedIdentity,
  getCachedIdentity,
  getIdentityCacheKey,
  getInFlightIdentityRequest,
  setCachedIdentity,
  setInFlightIdentityRequest,
} from "src/lib/identity-cache";
import { privateRouteJson } from "src/lib/private-route-response";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export interface VerifiedDiscogsUser {
  userId: number;
  username: string;
}

export type VerifiedUserResult =
  | { user: VerifiedDiscogsUser; error?: never }
  | { user?: never; error: NextResponse };

const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export const DISCOGS_SESSION_COOKIE = "discogs_session";

export const DISCOGS_RECONNECT_USERNAME_COOKIE = "discogs_reconnect_username";

function getSecureCookieFlag(): boolean {
  return process.env.NODE_ENV === "production";
}

export function hasActiveDiscogsSession(request: NextRequest): boolean {
  return request.cookies.get(DISCOGS_SESSION_COOKIE)?.value === "1";
}

export function setDiscogsSessionCookie(response: NextResponse): void {
  const secureFlag = getSecureCookieFlag();

  response.cookies.set(DISCOGS_SESSION_COOKIE, "1", {
    httpOnly: true,
    secure: secureFlag,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
}

export function clearDiscogsSessionCookie(response: NextResponse): void {
  const secureFlag = getSecureCookieFlag();

  response.cookies.set(DISCOGS_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: secureFlag,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function getDiscogsRateLimitResponse(): NextResponse {
  return privateRouteJson(
    { error: "Discogs rate limit exceeded. Please try again shortly." },
    {
      status: 503,
      headers: {
        "Retry-After": "60",
      },
    },
  );
}

export function getDisplayIdentityFromCookies(
  request: NextRequest,
): VerifiedDiscogsUser | null {
  if (!hasActiveDiscogsSession(request)) {
    return null;
  }

  const userIdCookie = request.cookies.get("discogs_user_id")?.value;
  const usernameCookie = request.cookies.get("discogs_username")?.value;

  if (!(userIdCookie && usernameCookie)) {
    return null;
  }

  const userId = Number.parseInt(userIdCookie, 10);
  if (Number.isNaN(userId)) {
    return null;
  }

  return {
    userId,
    username: usernameCookie,
  };
}

export function syncIdentityCookies(
  response: NextResponse,
  identity: VerifiedDiscogsUser,
): void {
  const secureFlag = getSecureCookieFlag();

  response.cookies.set("discogs_username", identity.username, {
    httpOnly: false,
    secure: secureFlag,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });

  response.cookies.set("discogs_user_id", identity.userId.toString(), {
    httpOnly: true,
    secure: secureFlag,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });

  setDiscogsSessionCookie(response);
  setReconnectUsernameCookie(response, identity.username);
}

export function setReconnectUsernameCookie(
  response: NextResponse,
  username: string,
): void {
  const secureFlag = getSecureCookieFlag();

  response.cookies.set(DISCOGS_RECONNECT_USERNAME_COOKIE, username, {
    httpOnly: false,
    secure: secureFlag,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
}

export function clearReconnectUsernameCookie(response: NextResponse): void {
  const secureFlag = getSecureCookieFlag();

  response.cookies.set(DISCOGS_RECONNECT_USERNAME_COOKIE, "", {
    httpOnly: false,
    secure: secureFlag,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getStoredReconnectUsername(
  request: NextRequest,
): string | null {
  const accessToken = request.cookies.get("discogs_access_token")?.value;
  const accessTokenSecret = request.cookies.get(
    "discogs_access_token_secret",
  )?.value;

  if (!(accessToken && accessTokenSecret)) {
    return null;
  }

  return request.cookies.get(DISCOGS_RECONNECT_USERNAME_COOKIE)?.value ?? null;
}

export function primeVerifiedIdentityCache(
  accessToken: string,
  accessTokenSecret: string,
  identity: VerifiedDiscogsUser,
): void {
  const cacheKey = getIdentityCacheKey(accessToken, accessTokenSecret);
  setCachedIdentity(cacheKey, identity);
}

export function clearVerifiedIdentityCache(
  accessToken: string,
  accessTokenSecret: string,
): void {
  clearCachedIdentity(getIdentityCacheKey(accessToken, accessTokenSecret));
}

async function fetchVerifiedIdentity(
  accessToken: string,
  accessTokenSecret: string,
): Promise<VerifiedDiscogsUser> {
  const cacheKey = getIdentityCacheKey(accessToken, accessTokenSecret);
  const cached = getCachedIdentity(cacheKey);
  if (cached) {
    return {
      userId: cached.userId,
      username: cached.username,
    };
  }

  const inFlight = getInFlightIdentityRequest(cacheKey);
  if (inFlight) {
    const identity = await inFlight;
    return {
      userId: identity.userId,
      username: identity.username,
    };
  }

  const requestPromise = (async (): Promise<CachedDiscogsIdentity> => {
    const identity = await discogsOAuthService.getIdentity(
      accessToken,
      accessTokenSecret,
    );

    return setCachedIdentity(cacheKey, {
      userId: identity.id,
      username: identity.username,
    });
  })();

  setInFlightIdentityRequest(cacheKey, requestPromise);

  const identity = await requestPromise;
  return {
    userId: identity.userId,
    username: identity.username,
  };
}

async function getVerifiedUserFromOAuthCookies(
  request: NextRequest,
): Promise<VerifiedUserResult> {
  const accessToken = request.cookies.get("discogs_access_token")?.value;
  const accessTokenSecret = request.cookies.get(
    "discogs_access_token_secret",
  )?.value;

  if (!(accessToken && accessTokenSecret)) {
    return {
      error: privateRouteJson({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const cacheKey = getIdentityCacheKey(accessToken, accessTokenSecret);

  try {
    const user = await fetchVerifiedIdentity(accessToken, accessTokenSecret);
    return { user };
  } catch (error) {
    const status = (error as Error & { status?: number }).status;

    if (status === 429) {
      const stale = getCachedIdentity(cacheKey, true);
      if (stale) {
        return {
          user: {
            userId: stale.userId,
            username: stale.username,
          },
        };
      }

      return { error: getDiscogsRateLimitResponse() };
    }

    console.error("OAuth identity verification failed:", error);
    return {
      error: privateRouteJson({ error: "Unauthorized" }, { status: 401 }),
    };
  }
}

export async function getVerifiedUserFromRequest(
  request: NextRequest,
): Promise<VerifiedUserResult> {
  if (!hasActiveDiscogsSession(request)) {
    return {
      error: privateRouteJson({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return getVerifiedUserFromOAuthCookies(request);
}

export async function getVerifiedUserFromStoredTokens(
  request: NextRequest,
): Promise<VerifiedUserResult> {
  return getVerifiedUserFromOAuthCookies(request);
}

export async function getOptionalVerifiedUserFromRequest(
  request: NextRequest,
): Promise<VerifiedDiscogsUser | null> {
  const result = await getVerifiedUserFromRequest(request);
  if ("error" in result) {
    return null;
  }

  return result.user;
}

export type AuthenticatedDiscogsSession =
  | {
      user: VerifiedDiscogsUser;
      accessToken: string;
      accessTokenSecret: string;
      error?: never;
    }
  | { error: NextResponse };

export async function requireAuthenticatedDiscogsUser(
  request: NextRequest,
  requestedUsername: string,
): Promise<AuthenticatedDiscogsSession> {
  const accessToken = request.cookies.get("discogs_access_token")?.value;
  const accessTokenSecret = request.cookies.get(
    "discogs_access_token_secret",
  )?.value;

  if (!(accessToken && accessTokenSecret)) {
    return {
      error: privateRouteJson({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  const verified = await getVerifiedUserFromRequest(request);
  if ("error" in verified) {
    return { error: verified.error };
  }

  if (
    verified.user.username.toLowerCase() !== requestedUsername.toLowerCase()
  ) {
    return {
      error: privateRouteJson({ error: "Unauthorized" }, { status: 403 }),
    };
  }

  return {
    user: verified.user,
    accessToken,
    accessTokenSecret,
  };
}
