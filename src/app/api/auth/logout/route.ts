import type { NextRequest } from "next/server";
import { clearVerifiedIdentityCache } from "src/lib/auth-request";
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

  // Preserve OAuth tokens only when explicitly requested (shared-device convenience).
  const preserveTokens =
    request.nextUrl.searchParams.get("preserve_tokens") === "true";

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

  if (!preserveTokens) {
    response.cookies.set("discogs_access_token", "", clearCookieOptions);
    response.cookies.set("discogs_access_token_secret", "", clearCookieOptions);
  }

  return response;
}
