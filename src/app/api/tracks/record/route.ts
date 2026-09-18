import type { NextRequest } from "next/server";
import {
  createErrorResponse,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import { privateRouteJson } from "src/lib/private-route-response";
import { recordUserTrackEvent } from "src/lib/user-track.server";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";
import { userTrackRecordBodySchema } from "src/lib/validation/userTrack.schemas";

export const POST = async (request: NextRequest) => {
  const verified = await getVerifiedUserFromRequestWithRateLimit(request, true);

  if ("error" in verified) {
    return verified.error;
  }

  const parsedBody = await parseRequestBody(request, userTrackRecordBodySchema);

  if ("error" in parsedBody) {
    return privateRouteJson({ error: parsedBody.error }, { status: 400 });
  }

  try {
    await recordUserTrackEvent(verified.user.userId, parsedBody.data);
    return privateRouteJson({ ok: true });
  } catch (error) {
    return createErrorResponse(error);
  }
};
