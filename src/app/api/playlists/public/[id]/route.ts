import { type NextRequest, NextResponse } from "next/server";
import { logSanitizedApiRouteFailure } from "src/lib/api-helpers";
import { getOptionalVerifiedUserFromRequest } from "src/lib/auth-request";
import { isValidCrateId } from "src/lib/crate-id";
import { prisma } from "src/lib/db";
import {
  getIpRateLimitResponse,
  PUBLIC_CRATE_RATE_LIMIT_CONFIG,
} from "src/lib/ip-rate-limit";
import { loadPublicPlaylist } from "src/lib/public-playlist-load.server";
import { findPublicPlaylistById } from "src/lib/public-playlist-query.server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimitResponse = getIpRateLimitResponse(
    request,
    PUBLIC_CRATE_RATE_LIMIT_CONFIG,
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

    const playlistRow = await findPublicPlaylistById(id);

    if (!playlistRow) {
      return NextResponse.json(
        { error: "Playlist not found or is private" },
        { status: 404 },
      );
    }

    const viewer = await getOptionalVerifiedUserFromRequest(request);
    const isOwner = viewer?.userId === playlistRow.user_id;

    if (!playlistRow.username && isOwner && viewer?.username) {
      await prisma.playlist.update({
        where: {
          user_id_id: {
            user_id: playlistRow.user_id,
            id: playlistRow.id,
          },
        },
        data: {
          username: viewer.username,
        },
      });
    }

    const payload = await loadPublicPlaylist(id);

    if (!payload) {
      return NextResponse.json(
        { error: "Playlist not found or is private" },
        { status: 404 },
      );
    }

    if (isOwner && viewer?.username && !payload.playlist.username) {
      payload.playlist.username = viewer.username;
    }

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    const sanitized = logSanitizedApiRouteFailure(
      "/api/playlists/public/[id]",
      error,
      "Error fetching public playlist:",
    );
    return NextResponse.json(
      { error: sanitized.message },
      { status: sanitized.status },
    );
  }
}
