import { type NextRequest, NextResponse } from "next/server";
import { requireReadOnlyDiscogsUser } from "src/lib/auth-request";
import { buildDiscogsProxyErrorPayload } from "src/lib/discogs-api-error";
import { isValidDiscogsUsername } from "src/lib/discogs-username";
import { rethrowNextInternalError } from "src/lib/rethrowNextInternalError";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export async function GET(request: NextRequest) {
  try {
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

    const session = await requireReadOnlyDiscogsUser(request, username);
    if ("error" in session) {
      return session.error;
    }

    const fields = await discogsOAuthService.getCollectionFields(
      session.user.username,
      session.accessToken,
      session.accessTokenSecret,
    );

    return NextResponse.json(fields, {
      headers: {
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=7200",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    rethrowNextInternalError(error);
    console.error("getCollectionFields error:", error);
    const { body, status, rateLimitInit } = buildDiscogsProxyErrorPayload({
      error,
      fallbackMessage: "Failed to fetch collection fields",
    });

    return NextResponse.json(body, {
      status,
      ...(rateLimitInit ?? {}),
    });
  }
}
