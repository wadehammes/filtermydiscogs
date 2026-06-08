import { type NextRequest, NextResponse } from "next/server";
import { getVerifiedUserFromRequest } from "src/lib/auth-request";

export async function GET(request: NextRequest) {
  try {
    const verified = await getVerifiedUserFromRequest(request);

    if ("error" in verified) {
      if (verified.error.status === 503) {
        const username = request.cookies.get("discogs_username")?.value ?? null;
        const userId = request.cookies.get("discogs_user_id")?.value ?? null;

        return NextResponse.json(
          {
            isAuthenticated: Boolean(username && userId),
            username,
            userId,
            rateLimited: true,
          },
          {
            headers: {
              "Cache-Control": "private, no-cache, no-store, must-revalidate",
              "Retry-After": "60",
            },
          },
        );
      }

      return NextResponse.json(
        {
          isAuthenticated: false,
          username: null,
          userId: null,
        },
        {
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        },
      );
    }

    return NextResponse.json(
      {
        isAuthenticated: true,
        username: verified.user.username,
        userId: String(verified.user.userId),
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({
      isAuthenticated: false,
      username: null,
      userId: null,
    });
  }
}
