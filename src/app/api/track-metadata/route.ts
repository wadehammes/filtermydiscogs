import type { NextRequest } from "next/server";
import { getVerifiedUserFromRequestWithRateLimit } from "src/lib/api-helpers";
import {
  isGetSongBpmConfigured,
  lookupTrackDjMetadataBatch,
} from "src/lib/getsongbpm.server";
import { privateRouteJson } from "src/lib/private-route-response";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";
import { trackMetadataBatchRequestSchema } from "src/lib/validation/trackMetadata.schemas";

export async function POST(request: NextRequest) {
  const verified = await getVerifiedUserFromRequestWithRateLimit(request);
  if ("error" in verified) {
    return verified.error;
  }

  if (!isGetSongBpmConfigured()) {
    return privateRouteJson(
      { error: "Track metadata lookup is not configured" },
      { status: 503 },
    );
  }

  const parsedBody = await parseRequestBody(
    request,
    trackMetadataBatchRequestSchema,
    { invalidJsonMessage: "Invalid JSON body" },
  );
  if ("error" in parsedBody) {
    return privateRouteJson({ error: parsedBody.error }, { status: 400 });
  }

  const results = await lookupTrackDjMetadataBatch(parsedBody.data.lookups);

  return privateRouteJson({ results });
}
