import type { NextRequest } from "next/server";
import {
  clearDiscogsSessionCookie,
  clearReconnectUsernameCookie,
  getVerifiedUserFromRequest,
} from "src/lib/auth-request";
import { enforceAuthRouteIpRateLimit } from "src/lib/auth-route-guards";
import { orm } from "src/lib/db";
import { privateRouteJson } from "src/lib/private-route-response";
import { rethrowNextInternalError } from "src/lib/rethrowNextInternalError";

export async function POST(request: NextRequest) {
  const rateLimitResponse = enforceAuthRouteIpRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const secureFlag = process.env.NODE_ENV === "production";

  const clearCookieOptions = {
    httpOnly: true,
    secure: secureFlag,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  const clearDisplayCookieOptions = {
    httpOnly: false,
    secure: secureFlag,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  const verified = await getVerifiedUserFromRequest(request);
  if ("error" in verified) {
    return verified.error;
  }

  try {
    await orm.ProductAnalyticsEvents.where({
      userId: verified.user.userId,
    }).deleteAndCount();

    await orm.Users.where({
      discogsUserId: verified.user.userId,
    }).delete();
  } catch (error) {
    rethrowNextInternalError(error);
    console.error("Error clearing crate data for user:", error);
    return privateRouteJson(
      { error: "Failed to clear stored data" },
      { status: 500 },
    );
  }

  const response = privateRouteJson({ success: true });

  response.cookies.set("discogs_username", "", clearDisplayCookieOptions);
  response.cookies.set("discogs_user_id", "", clearCookieOptions);
  response.cookies.set("discogs_access_token", "", clearCookieOptions);
  response.cookies.set("discogs_access_token_secret", "", clearCookieOptions);
  response.cookies.set("oauth_token", "", clearCookieOptions);
  response.cookies.set("oauth_token_secret", "", clearCookieOptions);

  clearDiscogsSessionCookie(response);
  clearReconnectUsernameCookie(response);

  return response;
}
