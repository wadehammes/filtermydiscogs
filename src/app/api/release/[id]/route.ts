import { type NextRequest, NextResponse } from "next/server";
import { getReadOnlyVerifiedUserFromRequest } from "src/lib/auth-request";
import { rethrowNextInternalError } from "src/lib/rethrowNextInternalError";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

const AUTHENTICATED_RELEASE_CACHE =
  "private, max-age=3600, stale-while-revalidate=7200";
const PUBLIC_RELEASE_CACHE =
  "public, max-age=3600, stale-while-revalidate=7200";

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
    const releaseUrl = `https://api.discogs.com/releases/${releaseId}`;

    if (accessToken && accessTokenSecret) {
      const verified = await getReadOnlyVerifiedUserFromRequest(request);
      if ("error" in verified) {
        return verified.error;
      }

      const release = await discogsOAuthService.makeAuthenticatedRequest(
        releaseUrl,
        "GET",
        accessToken,
        accessTokenSecret,
      );

      return NextResponse.json(release, {
        headers: {
          "Cache-Control": AUTHENTICATED_RELEASE_CACHE,
        },
      });
    }

    const release = await discogsOAuthService.makeConsumerRequest(
      releaseUrl,
      "GET",
    );

    return NextResponse.json(release, {
      headers: {
        "Cache-Control": PUBLIC_RELEASE_CACHE,
      },
    });
  } catch (error) {
    rethrowNextInternalError(error);
    console.error("Release API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch release" },
      { status: 500 },
    );
  }
}
