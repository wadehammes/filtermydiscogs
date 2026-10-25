import type { NextRequest } from "next/server";
import {
  createErrorResponse,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import {
  deletePlaylist,
  getPlaylistDetail,
  updatePlaylistFields,
} from "src/lib/playlist.server";
import { requirePlaylistsFeatureEnabled } from "src/lib/playlistsFeatureGuard.server";
import { privateRouteJson } from "src/lib/private-route-response";
import { revalidatePublicShareSeo } from "src/lib/public-share-cache.server";
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
    const { name, private: privateField } = parsedBody.data;
    const fields: Parameters<typeof updatePlaylistFields>[2] = {};

    if (name !== undefined) {
      fields.name = name;
    }

    if (privateField !== undefined) {
      fields.private = privateField;

      if (privateField === false && verified.user.username) {
        fields.username = verified.user.username;
      }
    }

    const updated = await updatePlaylistFields(
      verified.user.userId,
      id,
      fields,
    );

    if (!updated) {
      return privateRouteJson({ error: "Playlist not found" }, { status: 404 });
    }

    const playlist = await getPlaylistDetail(verified.user.userId, id);

    if (privateField !== undefined) {
      revalidatePublicShareSeo({ kind: "playlist", id });
    }

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
