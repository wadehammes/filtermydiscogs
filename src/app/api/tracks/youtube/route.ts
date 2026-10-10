import type { NextRequest } from "next/server";
import {
  createErrorResponse,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import { privateRouteJson } from "src/lib/private-route-response";
import { saveUserTrackYoutubeOverride } from "src/lib/user-track.server";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";
import { userTrackYoutubeOverrideBodySchema } from "src/lib/validation/userTrack.schemas";

export const PATCH = async (request: NextRequest) => {
  const verified = await getVerifiedUserFromRequestWithRateLimit(request, true);

  if ("error" in verified) {
    return verified.error;
  }

  const parsedBody = await parseRequestBody(
    request,
    userTrackYoutubeOverrideBodySchema,
  );

  if ("error" in parsedBody) {
    return privateRouteJson({ error: parsedBody.error }, { status: 400 });
  }

  try {
    await saveUserTrackYoutubeOverride(verified.user.userId, parsedBody.data);
    return privateRouteJson({ ok: true });
  } catch (error) {
    return createErrorResponse(error, { route: "/api/tracks/youtube" });
  }
};
