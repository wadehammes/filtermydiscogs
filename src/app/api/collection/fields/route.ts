import { type NextRequest, NextResponse } from "next/server";
import { isValidDiscogsUsername } from "src/lib/discogs-username";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    if (!isValidDiscogsUsername(username)) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400 },
      );
    }

    const accessToken = request.cookies.get("discogs_access_token")?.value;
    const accessTokenSecret = request.cookies.get(
      "discogs_access_token_secret",
    )?.value;
    const storedUsername = request.cookies.get("discogs_username")?.value;

    if (!(accessToken && accessTokenSecret && storedUsername)) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (storedUsername.toLowerCase() !== username.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const fields = await discogsOAuthService.getCollectionFields(
      username,
      accessToken,
      accessTokenSecret,
    );

    return NextResponse.json(fields, {
      headers: {
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("getCollectionFields error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch collection fields";
    const upstreamStatus =
      error instanceof Error
        ? (error as Error & { status?: number }).status
        : undefined;

    let status =
      upstreamStatus ??
      (errorMessage.toLowerCase().includes("too many requests") ? 429 : 500);

    if (
      upstreamStatus !== undefined &&
      upstreamStatus >= 500 &&
      upstreamStatus < 600
    ) {
      status = 502;
    }

    return NextResponse.json(
      {
        error:
          status === 429
            ? "Rate limit exceeded. Please try again in a moment."
            : "Failed to fetch collection fields",
        ...(process.env.NODE_ENV === "development"
          ? { details: errorMessage }
          : {}),
      },
      { status },
    );
  }
}
