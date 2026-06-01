import { type NextRequest, NextResponse } from "next/server";
import { isValidDiscogsUsername } from "src/lib/discogs-username";
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

    // Validate and sanitize perPage parameter (Discogs allows 1-500)
    const perPage = Math.max(
      1,
      Math.min(500, parseInt(perPageParam || "100", 10)),
    );
    if (Number.isNaN(perPage) || perPage < 1) {
      return NextResponse.json(
        { error: "Invalid per_page parameter (must be 1-500)" },
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
    const accessToken = request.cookies.get("discogs_access_token")?.value;
    const accessTokenSecret = request.cookies.get(
      "discogs_access_token_secret",
    )?.value;
    const storedUsername = request.cookies.get("discogs_username")?.value;

    if (!(accessToken && accessTokenSecret && storedUsername)) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (storedUsername.toLowerCase() !== username.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const collection = await discogsOAuthService.getCollection(
      username,
      accessToken,
      accessTokenSecret,
      page,
      perPage,
      sort,
      sortOrder,
    );

    return NextResponse.json(collection, {
      headers: {
        "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("getCollection error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch collection";
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

    return NextResponse.json(body, { status });
  }
}
