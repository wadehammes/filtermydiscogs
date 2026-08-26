import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminFromRequest } from "src/lib/admin-helpers";
import { getAdminUserLookup } from "src/lib/admin-user-lookup.server";
import { isValidDiscogsUsername } from "src/lib/discogs-username";
import { rethrowNextInternalError } from "src/lib/rethrowNextInternalError";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const isAdmin = await verifyAdminFromRequest(request);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { username: usernameParam } = await params;
    const username = decodeURIComponent(usernameParam).trim();

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

    const lookup = await getAdminUserLookup(username);

    if (!lookup) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(lookup, {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    rethrowNextInternalError(error);
    console.error("Admin user lookup error:", error);
    return NextResponse.json(
      { error: "Failed to look up user" },
      { status: 500 },
    );
  }
}
