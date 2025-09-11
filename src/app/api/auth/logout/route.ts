import { type NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Clear all OAuth-related cookies
  response.cookies.delete("discogs_access_token");
  response.cookies.delete("discogs_access_token_secret");
  response.cookies.delete("discogs_username");
  response.cookies.delete("oauth_token");
  response.cookies.delete("oauth_token_secret");

  return response;
}
