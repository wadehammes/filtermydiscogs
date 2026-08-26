import { type NextRequest, NextResponse } from "next/server";
import { COLLECTION_PAGE_SIZE } from "src/constants/collection";
import { requireReadOnlyDiscogsUser } from "src/lib/auth-request";
import {
  discogsRateLimitResponseInit,
  getDiscogsApiErrorStatus,
} from "src/lib/discogs-api-error";
import { isValidDiscogsUsername } from "src/lib/discogs-username";
import { rethrowNextInternalError } from "src/lib/rethrowNextInternalError";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

// Valid sort values from Discogs API
const VALID_SORT_VALUES = [
  "added",
  "artist",
  "label",
  "title",
  "format",
  "rating",
  "year",
] as const;

const VALID_SORT_ORDERS = ["asc", "desc"] as const;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get("username");
    const pageParam = searchParams.get("page");
    const perPageParam = searchParams.get("per_page");
    const sort = searchParams.get("sort") || "added";
    const sortOrder = searchParams.get("sort_order") || "desc";

    // Validate username
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

    // Validate and sanitize page parameter
    const page = Math.max(1, Math.min(1000, parseInt(pageParam || "1", 10)));
    if (Number.isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: "Invalid page parameter" },
        { status: 400 },
      );
    }

    // Validate and sanitize perPage parameter (Discogs allows 1-100)
    const perPage = Math.max(
      1,
      Math.min(
        COLLECTION_PAGE_SIZE,
        parseInt(perPageParam || String(COLLECTION_PAGE_SIZE), 10),
      ),
    );
    if (Number.isNaN(perPage) || perPage < 1) {
      return NextResponse.json(
        {
          error: `Invalid per_page parameter (must be 1-${COLLECTION_PAGE_SIZE})`,
        },
        { status: 400 },
      );
    }

    // Validate sort parameter
    if (
      !VALID_SORT_VALUES.includes(sort as (typeof VALID_SORT_VALUES)[number])
    ) {
      return NextResponse.json(
        {
          error: `Invalid sort parameter. Must be one of: ${VALID_SORT_VALUES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate sortOrder parameter
    if (
      !VALID_SORT_ORDERS.includes(
        sortOrder as (typeof VALID_SORT_ORDERS)[number],
      )
    ) {
      return NextResponse.json(
        { error: "Invalid sort_order parameter. Must be 'asc' or 'desc'" },
        { status: 400 },
      );
    }
    const session = await requireReadOnlyDiscogsUser(request, username);
    if ("error" in session) {
      return session.error;
    }

    const collection = await discogsOAuthService.getCollection(
      session.user.username,
      session.accessToken,
      session.accessTokenSecret,
      page,
      perPage,
      sort,
      sortOrder,
    );

    return NextResponse.json(collection, {
      headers: {
        "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    rethrowNextInternalError(error);
    console.error("getCollection error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch collection";
    const upstreamStatus = getDiscogsApiErrorStatus(error);

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

    let message = "Failed to fetch collection";
    if (status === 429) {
      message = "Rate limit exceeded. Please try again in a moment.";
    } else if (status === 502 || upstreamStatus === 500) {
      message =
        "Discogs returned an error (their servers may be overloaded or temporarily down). Try again in a few minutes.";
    }

    const body: { details?: string; error: string } = { error: message };
    if (process.env.NODE_ENV === "development") {
      body.details = errorMessage;
    }

    return NextResponse.json(body, {
      status,
      ...(status === 429 ? discogsRateLimitResponseInit(error) : {}),
    });
  }
}
