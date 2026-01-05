import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get auth cookies
    const accessToken = request.cookies.get("discogs_access_token")?.value;
    const accessTokenSecret = request.cookies.get(
      "discogs_access_token_secret",
    )?.value;
    const username = request.cookies.get("discogs_username")?.value;

    // Check if we have all required auth data
    const isAuthenticated = !!(accessToken && accessTokenSecret && username);

    return NextResponse.json(
      {
        isAuthenticated,
        username: isAuthenticated ? username : null,
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
    });
  }
}
