import type { NextRequest } from "next/server";
import {
  createErrorResponse,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import {
  deletePlaylist,
  getPlaylistDetail,
  updatePlaylistName,
} from "src/lib/playlist.server";
import { requirePlaylistsFeatureEnabled } from "src/lib/playlistsFeatureGuard.server";
import { privateRouteJson } from "src/lib/private-route-response";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";
import { updatePlaylistBodySchema } from "src/lib/validation/playlist.schemas";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const featureError = await requirePlaylistsFeatureEnabled();
    if (featureError) {
      return featureError;
    }

    const verified = await getVerifiedUserFromRequestWithRateLimit(request);
    if ("error" in verified) {
      return verified.error;
    }

    const { id } = await params;
    const playlist = await getPlaylistDetail(verified.user.userId, id);

    if (!playlist) {
      return privateRouteJson({ error: "Playlist not found" }, { status: 404 });
    }

    return privateRouteJson({ playlist });
  } catch (error) {
    return createErrorResponse(error, { route: "/api/playlists/[id]" });
  }
}

export async function PATCH(
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
      updatePlaylistBodySchema,
    );
    if ("error" in parsedBody) {
      return privateRouteJson({ error: parsedBody.error }, { status: 400 });
    }

    const { id } = await params;
    const updated = await updatePlaylistName(
      verified.user.userId,
      id,
      parsedBody.data.name,
    );

    if (!updated) {
      return privateRouteJson({ error: "Playlist not found" }, { status: 404 });
    }

    const playlist = await getPlaylistDetail(verified.user.userId, id);

    return privateRouteJson({ playlist });
  } catch (error) {
    return createErrorResponse(error, { route: "/api/playlists/[id]" });
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

    const { id } = await params;
    const deleted = await deletePlaylist(verified.user.userId, id);

    if (!deleted) {
      return privateRouteJson({ error: "Playlist not found" }, { status: 404 });
    }

    return privateRouteJson({ success: true });
  } catch (error) {
    return createErrorResponse(error, { route: "/api/playlists/[id]" });
  }
}
