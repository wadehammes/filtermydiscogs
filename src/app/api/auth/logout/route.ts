import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Check if user wants to clear tokens (for security on shared devices)
  // Default is to preserve tokens for convenience
  const clearTokens =
    request.nextUrl.searchParams.get("clear_tokens") === "true";

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

  // Always clear session state (username)
  response.cookies.set("discogs_username", "", clearCookieOptions);

  // Always clear temporary OAuth request tokens
  response.cookies.set("oauth_token", "", clearCookieOptions);
  response.cookies.set("oauth_token_secret", "", clearCookieOptions);

  // Preserve access tokens by default for convenience (users can log back in without re-authorization)
  // Only clear tokens if explicitly requested (e.g., for security on shared devices)
  if (clearTokens) {
    response.cookies.set("discogs_access_token", "", clearCookieOptions);
    response.cookies.set("discogs_access_token_secret", "", clearCookieOptions);
  }

  return response;
}
