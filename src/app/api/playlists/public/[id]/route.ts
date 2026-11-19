import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { logSanitizedApiRouteFailure } from "src/lib/api-helpers";
import {
  getOptionalVerifiedUserFromRequest,
  getReadOnlyVerifiedUserFromRequest,
  hasActiveDiscogsSession,
} from "src/lib/auth-request";
import { isValidCrateId } from "src/lib/crate-id";
import { prisma } from "src/lib/db";
import {
  getIpRateLimitResponse,
  PUBLIC_CRATE_RATE_LIMIT_CONFIG,
} from "src/lib/ip-rate-limit";
import {
  attachViewerVotesToPlaylistTracks,
  mergeAnonymousPlaylistVoterVotes,
} from "src/lib/playlist-track-vote.server";
import { loadPublicPlaylist } from "src/lib/public-playlist-load.server";
import { findPublicPlaylistById } from "src/lib/public-playlist-query.server";
import {
  buildPlaylistTrackVoterLookupKeys,
  readPublicPlaylistAnonymousVoterId,
  setPublicPlaylistAnonymousVoterCookie,
} from "src/lib/public-playlist-voter.server";
import { publicPlaylistGetQuerySchema } from "src/lib/validation/playlist.schemas";

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

    const queryParse = publicPlaylistGetQuerySchema.safeParse({
      discogsHydration:
        request.nextUrl.searchParams.get("discogsHydration") ?? undefined,
    });

    if (!queryParse.success) {
      const message =
        queryParse.error.issues[0]?.message ?? "Invalid query parameters";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { discogsHydration } = queryParse.data;

    const playlistRow = await findPublicPlaylistById(id);

    if (!playlistRow) {
      return NextResponse.json(
        { error: "Playlist not found or is private" },
        { status: 404 },
      );
    }

    const viewer = await getOptionalVerifiedUserFromRequest(request);
    let verifiedOwnerUsername: string | null = null;

    if (hasActiveDiscogsSession(request)) {
      const verified = await getReadOnlyVerifiedUserFromRequest(request);

      if ("user" in verified && verified.user.userId === playlistRow.user_id) {
        verifiedOwnerUsername = verified.user.username;
      }
    }

    const isOwner = verifiedOwnerUsername != null;

    if (!playlistRow.username && isOwner && verifiedOwnerUsername) {
      await prisma.playlist.update({
        where: {
          user_id_id: {
            user_id: playlistRow.user_id,
            id: playlistRow.id,
          },
        },
        data: {
          username: verifiedOwnerUsername,
        },
      });
    }

    const payload = await loadPublicPlaylist(id, {
      playlist: playlistRow,
      discogsHydration,
    });

    if (!payload) {
      return NextResponse.json(
        { error: "Playlist not found or is private" },
        { status: 404 },
      );
    }

    if (isOwner && verifiedOwnerUsername && !payload.playlist.username) {
      payload.playlist.username = verifiedOwnerUsername;
    }

    let anonymousVoterId = readPublicPlaylistAnonymousVoterId(request);
    let issuedAnonymousVoterId: string | null = null;

    if (!(isOwner || viewer?.userId || anonymousVoterId)) {
      issuedAnonymousVoterId = randomUUID();
      anonymousVoterId = issuedAnonymousVoterId;
    }

    if (!isOwner) {
      if (viewer?.userId && anonymousVoterId) {
        await mergeAnonymousPlaylistVoterVotes(
          playlistRow.user_id,
          playlistRow.id,
          viewer.userId,
          anonymousVoterId,
        );
      }

      const voterKeys = buildPlaylistTrackVoterLookupKeys(
        viewer?.userId,
        anonymousVoterId,
      );
      payload.tracks = await attachViewerVotesToPlaylistTracks(
        playlistRow.user_id,
        playlistRow.id,
        payload.tracks,
        voterKeys.length > 0 ? voterKeys : null,
      );
    }

    const response = NextResponse.json(
      {
        ...payload,
        viewerIsOwner: isOwner,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          Vary: "Cookie",
        },
      },
    );

    if (issuedAnonymousVoterId) {
      setPublicPlaylistAnonymousVoterCookie(response, issuedAnonymousVoterId);
    }

    return response;
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
