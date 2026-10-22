import type { NextRequest } from "next/server";
import {
  createErrorResponse,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import {
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
} from "src/lib/playlist.server";
import { requirePlaylistsFeatureEnabled } from "src/lib/playlistsFeatureGuard.server";
import { privateRouteJson } from "src/lib/private-route-response";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";
import {
  addPlaylistTrackBodySchema,
  removePlaylistTrackBodySchema,
  reorderPlaylistTracksBodySchema,
} from "src/lib/validation/playlist.schemas";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const featureError = await requirePlaylistsFeatureEnabled();
    if (featureError) {
      return featureError;
    }

    const verified = await getVerifiedUserFromRequestWithRateLimit(
      request,
      true,
    );
    if ("error" in verified) {
      return verified.error;
    }

    const parsedBody = await parseRequestBody(
      request,
      addPlaylistTrackBodySchema,
    );
    if ("error" in parsedBody) {
      return privateRouteJson({ error: parsedBody.error }, { status: 400 });
    }

    const { id } = await params;
    const result = await addTrackToPlaylist(
      verified.user.userId,
      id,
      parsedBody.data,
    );

    if (!result.created && result.reason === "playlist_not_found") {
      return privateRouteJson({ error: "Playlist not found" }, { status: 404 });
    }

    if (!result.created && result.reason === "duplicate") {
      return privateRouteJson(
        { error: "Track is already in this playlist" },
        { status: 409 },
      );
    }

    return privateRouteJson({ sort_order: result.sort_order }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, {
      route: "/api/playlists/[id]/tracks",
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const featureError = await requirePlaylistsFeatureEnabled();
    if (featureError) {
      return featureError;
    }

    const verified = await getVerifiedUserFromRequestWithRateLimit(
      request,
      true,
    );
    if ("error" in verified) {
      return verified.error;
    }

    const parsedBody = await parseRequestBody(
      request,
      removePlaylistTrackBodySchema,
    );
    if ("error" in parsedBody) {
      return privateRouteJson({ error: parsedBody.error }, { status: 400 });
    }

    const { id } = await params;
    const removed = await removeTrackFromPlaylist(
      verified.user.userId,
      id,
      parsedBody.data.track_key,
    );

    if (!removed) {
      return privateRouteJson({ error: "Track not found" }, { status: 404 });
    }

    return privateRouteJson({ success: true });
  } catch (error) {
    return createErrorResponse(error, {
      route: "/api/playlists/[id]/tracks",
    });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const featureError = await requirePlaylistsFeatureEnabled();
    if (featureError) {
      return featureError;
    }

    const verified = await getVerifiedUserFromRequestWithRateLimit(
      request,
      true,
    );
    if ("error" in verified) {
      return verified.error;
    }

    const parsedBody = await parseRequestBody(
      request,
      reorderPlaylistTracksBodySchema,
    );
    if ("error" in parsedBody) {
      return privateRouteJson({ error: parsedBody.error }, { status: 400 });
    }

    const { id } = await params;
    const reordered = await reorderPlaylistTracks(
      verified.user.userId,
      id,
      parsedBody.data.track_keys,
    );

    if (!reordered) {
      return privateRouteJson(
        { error: "Playlist not found or track list invalid" },
        { status: 400 },
      );
    }

    return privateRouteJson({ success: true });
  } catch (error) {
    return createErrorResponse(error, {
      route: "/api/playlists/[id]/tracks",
    });
  }
}
