import { type NextRequest, NextResponse } from "next/server";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: releaseId } = await params;

    // Validate release ID format (Discogs release IDs are numeric)
    if (!releaseId) {
      return NextResponse.json(
        { error: "Release ID is required" },
        { status: 400 },
      );
    }

    if (!/^\d+$/.test(releaseId) || releaseId.length > 10) {
      return NextResponse.json(
        { error: "Invalid release ID format" },
        { status: 400 },
      );
    }

    const accessToken = request.cookies.get("discogs_access_token")?.value;
    const accessTokenSecret = request.cookies.get(
      "discogs_access_token_secret",
    )?.value;

    if (!(accessToken && accessTokenSecret)) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const release = await discogsOAuthService.makeAuthenticatedRequest(
      `https://api.discogs.com/releases/${releaseId}`,
      "GET",
      accessToken,
      accessTokenSecret,
    );

    return NextResponse.json(release, {
      headers: {
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Release API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch release" },
      { status: 500 },
    );
  }
}
