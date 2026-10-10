import { type NextRequest, NextResponse } from "next/server";
import {
  getVerifiedUserFromRequestWithRateLimit,
  logSanitizedApiRouteFailure,
} from "src/lib/api-helpers";
import { fetchTopUserTracks } from "src/lib/user-track.server";

export async function GET(request: NextRequest) {
  try {
    const verified = await getVerifiedUserFromRequestWithRateLimit(request);
    if ("error" in verified) {
      return verified.error;
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "10", 10) || 10,
      50,
    );

    const tracks = await fetchTopUserTracks(verified.user.userId, limit);

    return NextResponse.json(tracks);
  } catch (error) {
    const sanitized = logSanitizedApiRouteFailure(
      "/api/dashboard/top-tracks",
      error,
      "Error fetching top user tracks:",
    );

    return NextResponse.json(
      { error: "Failed to fetch top tracks" },
      { status: sanitized.status },
    );
  }
}
