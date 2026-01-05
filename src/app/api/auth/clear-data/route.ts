import { type NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Use secure: false for development, true for production
  const secureFlag = process.env.NODE_ENV === "production";

  // Clear all OAuth-related cookies by setting them to expire immediately
  const clearCookieOptions = {
    httpOnly: true,
    secure: secureFlag,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0, // Expire immediately
  };

  // Clear all authentication cookies
  response.cookies.set("discogs_username", "", clearCookieOptions);
  response.cookies.set("discogs_access_token", "", clearCookieOptions);
  response.cookies.set("discogs_access_token_secret", "", clearCookieOptions);
  response.cookies.set("oauth_token", "", clearCookieOptions);
  response.cookies.set("oauth_token_secret", "", clearCookieOptions);

  return response;
}
