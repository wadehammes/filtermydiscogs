import { type NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedDiscogsUser } from "src/lib/auth-request";
import { isValidDiscogsUsername } from "src/lib/discogs-username";
import { updateReleaseRatingBodySchema } from "src/lib/validation/collection.schemas";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

const mapUpstreamError = (error: unknown, fallbackMessage: string) => {
  const errorMessage = error instanceof Error ? error.message : fallbackMessage;
  const upstreamStatus =
    error instanceof Error
      ? (error as Error & { status?: number }).status
      : undefined;

  let status =
    upstreamStatus ??
    (errorMessage.toLowerCase().includes("too many requests") ? 429 : 500);

  if (
    upstreamStatus !== undefined &&
    upstreamStatus >= 500 &&
    upstreamStatus < 600
  ) {
    status = 502;
  }

  const clientError =
    status === 429
      ? "Rate limit exceeded. Please try again in a moment."
      : errorMessage || fallbackMessage;

  return NextResponse.json(
    {
      error: clientError,
      ...(process.env.NODE_ENV === "development"
        ? { details: errorMessage }
        : {}),
    },
    { status },
  );
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
    console.error("updateReleaseRating route error:", error);
    return mapUpstreamError(error, "Failed to update release rating");
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
    console.error("deleteReleaseRating route error:", error);
    return mapUpstreamError(error, "Failed to clear release rating");
  }
}
