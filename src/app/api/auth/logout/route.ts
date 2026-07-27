import type { NextRequest } from "next/server";
import {
  clearDiscogsSessionCookie,
  clearReconnectUsernameCookie,
  clearVerifiedIdentityCache,
  setReconnectUsernameCookie,
} from "src/lib/auth-request";
import { privateRouteJson } from "src/lib/private-route-response";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("discogs_access_token")?.value;
  const accessTokenSecret = request.cookies.get(
    "discogs_access_token_secret",
  )?.value;

  if (accessToken && accessTokenSecret) {
    clearVerifiedIdentityCache(accessToken, accessTokenSecret);
  }

  const response = privateRouteJson({ success: true });

  const preserveTokens =
    request.nextUrl.searchParams.get("preserve_tokens") !== "false";

  const reconnectUsername = preserveTokens
    ? request.cookies.get("discogs_username")?.value
    : null;

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

  response.cookies.set("discogs_username", "", clearDisplayCookieOptions);
  response.cookies.set("discogs_user_id", "", clearCookieOptions);
  response.cookies.set("oauth_token", "", clearCookieOptions);
  response.cookies.set("oauth_token_secret", "", clearCookieOptions);

  clearDiscogsSessionCookie(response);

  if (reconnectUsername) {
    setReconnectUsernameCookie(response, reconnectUsername);
  } else {
    clearReconnectUsernameCookie(response);
  }

  if (!preserveTokens) {
    response.cookies.set("discogs_access_token", "", clearCookieOptions);
    response.cookies.set("discogs_access_token_secret", "", clearCookieOptions);
  }

  return response;
}
