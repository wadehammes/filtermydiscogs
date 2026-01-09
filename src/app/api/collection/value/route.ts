import { type NextRequest, NextResponse } from "next/server";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");
  const accessToken = request.cookies.get("discogs_access_token")?.value;
  const accessTokenSecret = request.cookies.get(
    "discogs_access_token_secret",
  )?.value;
  const storedUsername = request.cookies.get("discogs_username")?.value;

  try {
    // Validate username
    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_-]+$/.test(username) || username.length > 50) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400 },
      );
    }

    if (!(accessToken && accessTokenSecret && storedUsername)) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (storedUsername !== username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const collectionValue = await discogsOAuthService.getCollectionValue(
      username,
      accessToken,
      accessTokenSecret,
    );

    // Validate the response has the expected structure (already parsed to numbers in service)
    if (
      typeof collectionValue.minimum !== "number" ||
      typeof collectionValue.median !== "number" ||
      typeof collectionValue.maximum !== "number" ||
      Number.isNaN(collectionValue.minimum) ||
      Number.isNaN(collectionValue.median) ||
      Number.isNaN(collectionValue.maximum)
    ) {
      console.error("Invalid collection value response:", collectionValue);
      return NextResponse.json(
        { error: "Invalid collection value data received" },
        { status: 500 },
      );
    }

    return NextResponse.json(collectionValue, {
      headers: {
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Collection value API error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch collection value";

    // Log more details in development
    if (process.env.NODE_ENV === "development") {
      console.error("Collection value error details:", {
        error,
        username,
        hasAccessToken: !!accessToken,
        hasAccessTokenSecret: !!accessTokenSecret,
        storedUsername,
      });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
