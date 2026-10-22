import type { NextRequest, NextResponse } from "next/server";
import {
  DISCOGS_RATE_LIMIT_RETRY_AFTER_SECONDS,
  DISCOGS_UPSTREAM_UNAVAILABLE_MESSAGE,
  isDiscogsFetchTimeoutError,
  isDiscogsInvalidTokenStatus,
  resolveDiscogsVerificationFailureStatus,
} from "src/lib/discogs-api-error";
import {
  clearCachedIdentity,
  coalesceInFlightIdentityRequest,
  getCachedIdentity,
  getIdentityCacheKey,
  setCachedIdentity,
} from "src/lib/identity-cache";
import { privateRouteJson } from "src/lib/private-route-response";
import { reportApiRouteFailure } from "src/lib/sentry/reportApiRouteFailure";
import { applySentryUserFromVerifiedDiscogsUser } from "src/lib/sentry/syncSentryUser.server";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export interface VerifiedDiscogsUser {
  userId: number;
  username: string;
}

export type VerifiedUserResult =
  | { user: VerifiedDiscogsUser; error?: never }
  | { user?: never; error: NextResponse };

export interface VerifiedUserOptions {
  allowStale?: boolean;
  reportVerificationFailures?: boolean;
}

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
        "Retry-After": String(DISCOGS_RATE_LIMIT_RETRY_AFTER_SECONDS),
      },
    },
  );
}

function getDiscogsUnavailableResponse(): NextResponse {
  return privateRouteJson(
    { error: DISCOGS_UPSTREAM_UNAVAILABLE_MESSAGE },
    { status: 502 },
  );
}

export const isDiscogsVerificationUnavailable = (error: {
  status: number;
}): boolean => error.status === 502 || error.status === 503;

export const isDiscogsOutageAuthCheckStatus = (status: number): boolean =>
  status === 502;

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
  const cacheKey = getIdentityCacheKey({ accessToken, accessTokenSecret });
  setCachedIdentity({ cacheKey, identity });
}

export function clearVerifiedIdentityCache(
  accessToken: string,
  accessTokenSecret: string,
): void {
  clearCachedIdentity(getIdentityCacheKey({ accessToken, accessTokenSecret }));
}

async function fetchVerifiedIdentity(
  accessToken: string,
  accessTokenSecret: string,
  allowStale = false,
): Promise<VerifiedDiscogsUser> {
  const cacheKey = getIdentityCacheKey({ accessToken, accessTokenSecret });
  const cached = getCachedIdentity({ cacheKey, allowStale });
  if (cached) {
    return {
      userId: cached.userId,
      username: cached.username,
    };
  }

  const identity = await coalesceInFlightIdentityRequest(cacheKey, async () => {
    const discogsIdentity = await discogsOAuthService.getIdentity(
      accessToken,
      accessTokenSecret,
    );

    return setCachedIdentity({
      cacheKey,
      identity: {
        userId: discogsIdentity.id,
        username: discogsIdentity.username,
      },
    });
  });

  return {
    userId: identity.userId,
    username: identity.username,
  };
}

async function getVerifiedUserFromOAuthCookies(
  request: NextRequest,
  options: VerifiedUserOptions = {},
): Promise<VerifiedUserResult> {
  const allowStale = options.allowStale === true;
  const accessToken = request.cookies.get("discogs_access_token")?.value;
  const accessTokenSecret = request.cookies.get(
    "discogs_access_token_secret",
  )?.value;

  if (!(accessToken && accessTokenSecret)) {
    return {
      error: privateRouteJson({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const cacheKey = getIdentityCacheKey({ accessToken, accessTokenSecret });
  const cached = getCachedIdentity({ cacheKey, allowStale });
  if (cached) {
    return {
      user: {
        userId: cached.userId,
        username: cached.username,
      },
    };
  }

  if (allowStale && hasActiveDiscogsSession(request)) {
    const sessionIdentity = getDisplayIdentityFromCookies(request);
    if (sessionIdentity) {
      return { user: sessionIdentity };
    }
  }

  try {
    const user = await fetchVerifiedIdentity(
      accessToken,
      accessTokenSecret,
      allowStale,
    );
    return { user };
  } catch (error) {
    const status = resolveDiscogsVerificationFailureStatus(error);
    const isInvalidToken = isDiscogsInvalidTokenStatus(status);
    const isRateLimited = status === 429;
    const isUpstreamUnavailable = status !== undefined && status >= 500;

    if (isInvalidToken) {
      clearVerifiedIdentityCache(accessToken, accessTokenSecret);
    }

    const shouldReportVerificationFailure =
      options.reportVerificationFailures !== false &&
      !isDiscogsFetchTimeoutError(error) &&
      !isInvalidToken;

    if (isRateLimited || isUpstreamUnavailable) {
      const stale = getCachedIdentity({ cacheKey, allowStale: true });
      if (stale) {
        return {
          user: {
            userId: stale.userId,
            username: stale.username,
          },
        };
      }
    }

    if (isRateLimited) {
      return { error: getDiscogsRateLimitResponse() };
    }

    if (shouldReportVerificationFailure) {
      console.error("OAuth identity verification failed:", error);
      reportApiRouteFailure("auth/oauth-identity", error, {
        status: status ?? 500,
      });
    }

    if (isUpstreamUnavailable) {
      return { error: getDiscogsUnavailableResponse() };
    }

    return {
      error: privateRouteJson({ error: "Unauthorized" }, { status: 401 }),
    };
  }
}

const attachSentryUserToVerifiedResult = (
  result: VerifiedUserResult,
): VerifiedUserResult => {
  if ("user" in result) {
    applySentryUserFromVerifiedDiscogsUser(result.user);
  }

  return result;
};

export async function getVerifiedUserFromRequest(
  request: NextRequest,
  options: VerifiedUserOptions = {},
): Promise<VerifiedUserResult> {
  if (!hasActiveDiscogsSession(request)) {
    return {
      error: privateRouteJson({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return attachSentryUserToVerifiedResult(
    await getVerifiedUserFromOAuthCookies(request, options),
  );
}

export async function getVerifiedUserFromStoredTokens(
  request: NextRequest,
): Promise<VerifiedUserResult> {
  return attachSentryUserToVerifiedResult(
    await getVerifiedUserFromOAuthCookies(request, {
      reportVerificationFailures: false,
    }),
  );
}

export async function getOptionalVerifiedUserFromRequest(
  request: NextRequest,
): Promise<VerifiedDiscogsUser | null> {
  if (!hasActiveDiscogsSession(request)) {
    return null;
  }

  const displayIdentity = getDisplayIdentityFromCookies(request);
  if (displayIdentity) {
    return displayIdentity;
  }

  try {
    const result = await getVerifiedUserFromRequest(request, {
      allowStale: true,
      reportVerificationFailures: false,
    });
    if ("error" in result) {
      return null;
    }

    return result.user;
  } catch {
    return null;
  }
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
  options: VerifiedUserOptions = {},
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

  const verified = await getVerifiedUserFromRequest(request, options);
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

export async function getReadOnlyVerifiedUserFromRequest(
  request: NextRequest,
): Promise<VerifiedUserResult> {
  return getVerifiedUserFromRequest(request, { allowStale: true });
}

export async function requireReadOnlyDiscogsUser(
  request: NextRequest,
  requestedUsername: string,
): Promise<AuthenticatedDiscogsSession> {
  return requireAuthenticatedDiscogsUser(request, requestedUsername, {
    allowStale: true,
  });
}
