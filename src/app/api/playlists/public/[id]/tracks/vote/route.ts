import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { logSanitizedApiRouteFailure } from "src/lib/api-helpers";
import { getOptionalVerifiedUserFromRequest } from "src/lib/auth-request";
import { isValidCrateId } from "src/lib/crate-id";
import {
  getIpRateLimitResponse,
  PUBLIC_PLAYLIST_ENGAGEMENT_RATE_LIMIT_CONFIG,
} from "src/lib/ip-rate-limit";
import { recordPublicPlaylistTrackVote } from "src/lib/playlist-track-vote.server";
import {
  buildPlaylistTrackVoterKey,
  ensurePublicPlaylistAnonymousVoterCookie,
  readPublicPlaylistAnonymousVoterId,
  setPublicPlaylistAnonymousVoterCookie,
} from "src/lib/public-playlist-voter.server";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";
import { playlistTrackVoteBodySchema } from "src/lib/validation/playlistTrackVote.schemas";

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

    const parsedBody = await parseRequestBody(
      request,
      playlistTrackVoteBodySchema,
    );

    if ("error" in parsedBody) {
      return NextResponse.json({ error: parsedBody.error }, { status: 400 });
    }

    const body = parsedBody.data;
    const viewer = await getOptionalVerifiedUserFromRequest(request);
    let anonymousVoterId = readPublicPlaylistAnonymousVoterId(request);
    let issuedAnonymousVoterId: string | null = null;

    if (!(viewer?.userId || anonymousVoterId)) {
      issuedAnonymousVoterId = randomUUID();
      anonymousVoterId = issuedAnonymousVoterId;
    }

    const voterKey = buildPlaylistTrackVoterKey(
      viewer?.userId,
      anonymousVoterId,
    );

    if (!voterKey) {
      return NextResponse.json(
        { error: "Unable to establish voter identity" },
        { status: 400 },
      );
    }

    const result = await recordPublicPlaylistTrackVote({
      playlistId: id,
      trackKey: body.track_key,
      requestedVote: body.vote,
      voterKey,
      viewerUserId: viewer?.userId ?? null,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Playlist or track not found" },
        { status: 404 },
      );
    }

    const response = NextResponse.json({ ok: true, ...result });

    if (issuedAnonymousVoterId) {
      setPublicPlaylistAnonymousVoterCookie(response, issuedAnonymousVoterId);
    } else if (!viewer?.userId) {
      ensurePublicPlaylistAnonymousVoterCookie(response, request);
    }

    return response;
  } catch (error) {
    const sanitized = logSanitizedApiRouteFailure(
      "/api/playlists/public/[id]/tracks/vote",
      error,
      "Error recording playlist track vote:",
    );
    return NextResponse.json(
      { error: sanitized.message },
      { status: sanitized.status },
    );
  }
};
