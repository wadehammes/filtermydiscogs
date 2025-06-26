import { type NextRequest, NextResponse } from "next/server";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: releaseId } = await params;

    if (!releaseId) {
      return NextResponse.json(
        { error: "Release ID is required" },
        { status: 400 },
      );
    }

    // Get OAuth tokens from cookies
    const accessToken = request.cookies.get("discogs_access_token")?.value;
    const accessTokenSecret = request.cookies.get(
      "discogs_access_token_secret",
    )?.value;

    if (!(accessToken && accessTokenSecret)) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch release using OAuth
    const release = await discogsOAuthService.makeAuthenticatedRequest(
      `https://api.discogs.com/releases/${releaseId}`,
      "GET",
      accessToken,
      accessTokenSecret,
    );

    return NextResponse.json(release);
  } catch (error) {
    console.error("Release API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch release" },
      { status: 500 },
    );
  }
}
