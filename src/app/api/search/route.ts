import { type NextRequest, NextResponse } from "next/server";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("per_page") || "100", 10);
    const type = searchParams.get("type") || "release";
    const format = searchParams.get("format") || undefined;
    const year = searchParams.get("year") || undefined;
    const genre = searchParams.get("genre") || undefined;
    const style = searchParams.get("style") || undefined;

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
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

    return NextResponse.json(searchResults);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search releases" },
      { status: 500 },
    );
  }
}
