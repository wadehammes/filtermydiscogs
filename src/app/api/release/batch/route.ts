import { type NextRequest, NextResponse } from "next/server";
import { getReadOnlyVerifiedUserFromRequest } from "src/lib/auth-request";
import { runThrottledDiscogsRequest } from "src/lib/discogs-request-throttle";
import { rethrowNextInternalError } from "src/lib/rethrowNextInternalError";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";
import { releaseBatchBodySchema } from "src/lib/validation/release.schemas";
import { discogsOAuthService } from "src/services/discogs-oauth.service";
import type { DiscogsReleaseDetail } from "src/types";

const AUTHENTICATED_RELEASE_CACHE =
  "private, max-age=3600, stale-while-revalidate=7200";
const PUBLIC_RELEASE_CACHE =
  "public, max-age=3600, stale-while-revalidate=7200";

const isValidReleaseId = (releaseId: string) =>
  /^\d+$/.test(releaseId) && releaseId.length <= 10;

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

    if (accessToken && accessTokenSecret) {
      const verified = await getReadOnlyVerifiedUserFromRequest(request);
      if ("error" in verified) {
        return verified.error;
      }
    }

    const uniqueIds = [...new Set(parsedBody.data.ids)];
    const releases: Record<string, DiscogsReleaseDetail> = {};
    const cacheControl =
      accessToken && accessTokenSecret
        ? AUTHENTICATED_RELEASE_CACHE
        : PUBLIC_RELEASE_CACHE;

    for (const releaseId of uniqueIds) {
      if (!isValidReleaseId(releaseId)) {
        continue;
      }

      const releaseUrl = `https://api.discogs.com/releases/${releaseId}`;

      try {
        releases[releaseId] = await runThrottledDiscogsRequest(async () => {
          if (accessToken && accessTokenSecret) {
            return discogsOAuthService.makeAuthenticatedRequest(
              releaseUrl,
              "GET",
              accessToken,
              accessTokenSecret,
            ) as Promise<DiscogsReleaseDetail>;
          }

          return discogsOAuthService.makeConsumerRequest(
            releaseUrl,
            "GET",
          ) as Promise<DiscogsReleaseDetail>;
        });
      } catch {}
    }

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
    console.error("Release batch API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch releases" },
      { status: 500 },
    );
  }
}
