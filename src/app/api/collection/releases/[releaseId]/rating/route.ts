import { type NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedDiscogsUser } from "src/lib/auth-request";
import { buildDiscogsProxyErrorPayload } from "src/lib/discogs-api-error";
import { isValidDiscogsUsername } from "src/lib/discogs-username";
import { rethrowNextInternalError } from "src/lib/rethrowNextInternalError";
import { updateReleaseRatingBodySchema } from "src/lib/validation/collection.schemas";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

const jsonDiscogsProxyError = (error: unknown, fallbackMessage: string) => {
  const { body, status, rateLimitInit } = buildDiscogsProxyErrorPayload({
    error,
    fallbackMessage,
  });

  return NextResponse.json(body, {
    status,
    ...(rateLimitInit ?? {}),
  });
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ releaseId: string }> },
) {
  try {
    const { releaseId: releaseIdParam } = await params;
    const parsedBody = await parseRequestBody(
      request,
      updateReleaseRatingBodySchema,
    );

    if ("error" in parsedBody) {
      return NextResponse.json({ error: parsedBody.error }, { status: 400 });
    }

    const { username, rating } = parsedBody.data;

    if (!/^\d+$/.test(releaseIdParam)) {
      return NextResponse.json(
        { error: "Invalid release ID format" },
        { status: 400 },
      );
    }

    const session = await requireAuthenticatedDiscogsUser(request, username);
    if ("error" in session) {
      return session.error;
    }

    const releaseId = Number.parseInt(releaseIdParam, 10);
    const result = await discogsOAuthService.updateReleaseRating({
      releaseId,
      username: session.user.username,
      rating,
      oauthToken: session.accessToken,
      oauthTokenSecret: session.accessTokenSecret,
    });

    return NextResponse.json(result);
  } catch (error) {
    rethrowNextInternalError(error);
    console.error("updateReleaseRating route error:", error);
    return jsonDiscogsProxyError(error, "Failed to update release rating");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ releaseId: string }> },
) {
  try {
    const { releaseId: releaseIdParam } = await params;
    const username = request.nextUrl.searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    if (!isValidDiscogsUsername(username)) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400 },
      );
    }

    if (!/^\d+$/.test(releaseIdParam)) {
      return NextResponse.json(
        { error: "Invalid release ID format" },
        { status: 400 },
      );
    }

    const session = await requireAuthenticatedDiscogsUser(request, username);
    if ("error" in session) {
      return session.error;
    }

    const releaseId = Number.parseInt(releaseIdParam, 10);
    await discogsOAuthService.deleteReleaseRating({
      releaseId,
      username: session.user.username,
      oauthToken: session.accessToken,
      oauthTokenSecret: session.accessTokenSecret,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    rethrowNextInternalError(error);
    console.error("deleteReleaseRating route error:", error);
    return jsonDiscogsProxyError(error, "Failed to clear release rating");
  }
}
