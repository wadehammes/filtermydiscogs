import { type NextRequest, NextResponse } from "next/server";
import { logSanitizedApiRouteFailure } from "src/lib/api-helpers";
import { getOptionalVerifiedUserFromRequest } from "src/lib/auth-request";
import { isValidCrateId } from "src/lib/crate-id";
import {
  getIpRateLimitResponse,
  PUBLIC_PLAYLIST_ENGAGEMENT_RATE_LIMIT_CONFIG,
} from "src/lib/ip-rate-limit";
import {
  getPublicPlaylistShareStats,
  recordPublicPlaylistView,
} from "src/lib/playlist-engagement.server";
import {
  hasPublicPlaylistViewCookie,
  setPublicPlaylistViewRecordedCookie,
} from "src/lib/public-playlist-view-dedupe.server";

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const rateLimitResponse = getIpRateLimitResponse(
    request,
    PUBLIC_PLAYLIST_ENGAGEMENT_RATE_LIMIT_CONFIG,
  );

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { id } = await params;

    if (!isValidCrateId(id)) {
      return NextResponse.json(
        { error: "Invalid playlist id" },
        { status: 400 },
      );
    }

    const viewer = await getOptionalVerifiedUserFromRequest(request);

    if (hasPublicPlaylistViewCookie(request, id)) {
      const stats = await getPublicPlaylistShareStats(id);

      if (!stats) {
        return NextResponse.json(
          { error: "Playlist not found or is private" },
          { status: 404 },
        );
      }

      return NextResponse.json({ ok: true, shareStats: stats, deduped: true });
    }

    const stats = await recordPublicPlaylistView(id, viewer?.userId);

    if (!stats) {
      return NextResponse.json(
        { error: "Playlist not found or is private" },
        { status: 404 },
      );
    }

    const response = NextResponse.json({ ok: true, shareStats: stats });
    setPublicPlaylistViewRecordedCookie(response, id);
    return response;
  } catch (error) {
    const sanitized = logSanitizedApiRouteFailure(
      "/api/playlists/public/[id]/view",
      error,
      "Error recording public playlist view:",
    );
    return NextResponse.json(
      { error: sanitized.message },
      { status: sanitized.status },
    );
  }
};
