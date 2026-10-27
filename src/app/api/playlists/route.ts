import type { NextRequest } from "next/server";
import {
  createErrorResponse,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import { createPlaylist, listPlaylistsForUser } from "src/lib/playlist.server";
import { requirePlaylistsFeatureEnabled } from "src/lib/playlistsFeatureGuard.server";
import { privateRouteJson } from "src/lib/private-route-response";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";
import {
  createPlaylistBodySchema,
  listPlaylistsQuerySchema,
} from "src/lib/validation/playlist.schemas";

export async function GET(request: NextRequest) {
  try {
    const featureError = await requirePlaylistsFeatureEnabled();
    if (featureError) {
      return featureError;
    }

    const verified = await getVerifiedUserFromRequestWithRateLimit(request);
    if ("error" in verified) {
      return verified.error;
    }

    const query = listPlaylistsQuerySchema.safeParse({
      trackKey: request.nextUrl.searchParams.get("trackKey") ?? undefined,
    });
    if (!query.success) {
      return privateRouteJson(
        { error: query.error.flatten() },
        { status: 400 },
      );
    }

    const playlists = await listPlaylistsForUser(
      verified.user.userId,
      query.data.trackKey ? { trackKey: query.data.trackKey } : undefined,
    );

    return privateRouteJson({ playlists });
  } catch (error) {
    return createErrorResponse(error, { route: "/api/playlists" });
  }
}

export async function POST(request: NextRequest) {
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
      createPlaylistBodySchema,
    );
    if ("error" in parsedBody) {
      return privateRouteJson({ error: parsedBody.error }, { status: 400 });
    }

    const playlist = await createPlaylist(
      verified.user.userId,
      parsedBody.data.name,
      parsedBody.data.publicDescription,
    );

    return privateRouteJson({ playlist }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, { route: "/api/playlists" });
  }
}
