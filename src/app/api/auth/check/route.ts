import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get auth cookies
    const accessToken = request.cookies.get("discogs_access_token")?.value;
    const accessTokenSecret = request.cookies.get(
      "discogs_access_token_secret",
    )?.value;
    const username = request.cookies.get("discogs_username")?.value;
    const userId = request.cookies.get("discogs_user_id")?.value;

    // Check if we have all required auth data
    const isAuthenticated = !!(
      accessToken &&
      accessTokenSecret &&
      username &&
      userId
    );

    return NextResponse.json(
      {
        isAuthenticated,
        username: isAuthenticated ? username : null,
        userId: isAuthenticated ? userId : null,
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({
      isAuthenticated: false,
      username: null,
      userId: null,
    });
  }
}
