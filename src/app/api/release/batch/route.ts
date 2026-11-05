import { type NextRequest, NextResponse } from "next/server";
import { logSanitizedApiRouteFailure } from "src/lib/api-helpers";
import { getReadOnlyVerifiedUserFromRequest } from "src/lib/auth-request";
import { fetchDiscogsReleaseRecordsSequential } from "src/lib/fetchDiscogsReleaseRecordsSequential.server";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";
import { releaseBatchBodySchema } from "src/lib/validation/release.schemas";

const AUTHENTICATED_RELEASE_CACHE =
  "private, max-age=3600, stale-while-revalidate=7200";
const PUBLIC_RELEASE_CACHE =
  "public, max-age=3600, stale-while-revalidate=7200";

export async function POST(request: NextRequest) {
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
    const sanitized = logSanitizedApiRouteFailure(
      "/api/release/batch",
      error,
      "Release batch API error:",
    );
    return NextResponse.json(
      { error: "Failed to fetch releases" },
      { status: sanitized.status },
    );
  }
}
