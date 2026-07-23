import { type NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedDiscogsUser } from "src/lib/auth-request";
import { isValidDiscogsUsername } from "src/lib/discogs-username";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");
  try {
    // Validate username
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

    const session = await requireAuthenticatedDiscogsUser(request, username);
    if ("error" in session) {
      return session.error;
    }

    const collectionValue = await discogsOAuthService.getCollectionValue(
      session.user.username,
      session.accessToken,
      session.accessTokenSecret,
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

    if (process.env.NODE_ENV === "development") {
      console.error("Collection value error details:", {
        error,
        username,
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch collection value" },
      { status: 500 },
    );
  }
}
