import { type NextRequest, NextResponse } from "next/server";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

const VALID_SEARCH_TYPES = ["release", "master", "artist", "label"] as const;
const MAX_QUERY_LENGTH = 200;
const MAX_FILTER_LENGTH = 100;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const pageParam = searchParams.get("page");
    const perPageParam = searchParams.get("per_page");
    const type = searchParams.get("type") || "release";
    const format = searchParams.get("format") || undefined;
    const year = searchParams.get("year") || undefined;
    const genre = searchParams.get("genre") || undefined;
    const style = searchParams.get("style") || undefined;

    // Validate query parameter
    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 },
      );
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        {
          error: `Query parameter too long (max ${MAX_QUERY_LENGTH} characters)`,
        },
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

    // Validate and sanitize perPage parameter (Discogs allows 1-100 for search)
    const perPage = Math.max(
      1,
      Math.min(100, parseInt(perPageParam || "100", 10)),
    );
    if (Number.isNaN(perPage) || perPage < 1) {
      return NextResponse.json(
        { error: "Invalid per_page parameter (must be 1-100)" },
        { status: 400 },
      );
    }

    // Validate type parameter
    if (
      !VALID_SEARCH_TYPES.includes(type as (typeof VALID_SEARCH_TYPES)[number])
    ) {
      return NextResponse.json(
        {
          error: `Invalid type parameter. Must be one of: ${VALID_SEARCH_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate filter parameters length
    if (format && format.length > MAX_FILTER_LENGTH) {
      return NextResponse.json(
        {
          error: `Format parameter too long (max ${MAX_FILTER_LENGTH} characters)`,
        },
        { status: 400 },
      );
    }

    if (year && (year.length > 10 || !/^\d{4}(-\d{4})?$/.test(year))) {
      return NextResponse.json(
        { error: "Invalid year parameter format (expected YYYY or YYYY-YYYY)" },
        { status: 400 },
      );
    }

    if (genre && genre.length > MAX_FILTER_LENGTH) {
      return NextResponse.json(
        {
          error: `Genre parameter too long (max ${MAX_FILTER_LENGTH} characters)`,
        },
        { status: 400 },
      );
    }

    if (style && style.length > MAX_FILTER_LENGTH) {
      return NextResponse.json(
        {
          error: `Style parameter too long (max ${MAX_FILTER_LENGTH} characters)`,
        },
        { status: 400 },
      );
    }

    const accessToken = request.cookies.get("discogs_access_token")?.value;
    const accessTokenSecret = request.cookies.get(
      "discogs_access_token_secret",
    )?.value;

    if (!(accessToken && accessTokenSecret)) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const searchResults = await discogsOAuthService.searchReleases(
      accessToken,
      accessTokenSecret,
      query,
      page,
      perPage,
      type,
      format,
      year,
      genre,
      style,
    );

    return NextResponse.json(searchResults, {
      headers: {
        "Cache-Control": "private, max-age=180, stale-while-revalidate=360",
      },
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search releases" },
      { status: 500 },
    );
  }
}
