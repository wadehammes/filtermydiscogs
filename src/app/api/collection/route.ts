import { type NextRequest, NextResponse } from "next/server";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get("username");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("per_page") || "500", 10);
    const sort = searchParams.get("sort") || "added";
    const sortOrder = searchParams.get("sort_order") || "desc";

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
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

    if (storedUsername !== username) {
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
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch collection" },
      { status: 500 },
    );
  }
}
