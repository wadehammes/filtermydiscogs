import { type NextRequest, NextResponse } from "next/server";
import { DISCOGS_THROTTLE_CALLERS } from "src/constants/discogsThrottleCaller.constants";
import { getReadOnlyVerifiedUserFromRequest } from "src/lib/auth-request";
import { buildDiscogsProxyErrorPayload } from "src/lib/discogs-api-error";
import { rethrowNextInternalError } from "src/lib/rethrowNextInternalError";
import { fetchDiscogsReleaseRecordsSequential } from "src/lib/fetchDiscogsReleaseRecordsSequential.server";
import {
  DISCOGS_RELEASE_PROXY_RATE_LIMIT_CONFIG,
  getIpRateLimitResponse,
} from "src/lib/ip-rate-limit";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";
import { releaseBatchBodySchema } from "src/lib/validation/release.schemas";

const AUTHENTICATED_RELEASE_CACHE =
  "private, max-age=3600, stale-while-revalidate=7200";
const PUBLIC_RELEASE_CACHE =
  "public, max-age=3600, stale-while-revalidate=7200";

export async function POST(request: NextRequest) {
  const rateLimitResponse = getIpRateLimitResponse(
    request,
    DISCOGS_RELEASE_PROXY_RATE_LIMIT_CONFIG,
  );

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const parsedBody = await parseRequestBody(request, releaseBatchBodySchema);

    if ("error" in parsedBody) {
      return NextResponse.json({ error: parsedBody.error }, { status: 400 });
    }

    const accessToken = request.cookies.get("discogs_access_token")?.value;
    const accessTokenSecret = request.cookies.get(
      "discogs_access_token_secret",
    )?.value;

    let useAuthenticatedSession = false;

    if (accessToken && accessTokenSecret) {
      const verified = await getReadOnlyVerifiedUserFromRequest(request);
      useAuthenticatedSession = !("error" in verified);
    }

    const cacheControl = useAuthenticatedSession
      ? AUTHENTICATED_RELEASE_CACHE
      : PUBLIC_RELEASE_CACHE;

    const releases = await fetchDiscogsReleaseRecordsSequential({
      releaseIds: parsedBody.data.ids,
      useAuthenticatedSession,
      accessToken,
      accessTokenSecret,
      throttleCaller: DISCOGS_THROTTLE_CALLERS.apiReleaseBatch,
    });

    return NextResponse.json(
      { releases },
      {
        headers: {
          "Cache-Control": cacheControl,
        },
      },
    );
  } catch (error) {
    rethrowNextInternalError(error);
    const { body, status, rateLimitInit } = buildDiscogsProxyErrorPayload({
      error,
      fallbackMessage: "Failed to fetch releases",
    });

    return NextResponse.json(body, {
      status,
      ...(rateLimitInit ?? {}),
    });
  }
}
