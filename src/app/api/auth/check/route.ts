import { type NextRequest, NextResponse } from "next/server";
import {
  getDisplayIdentityFromCookies,
  getVerifiedUserFromRequest,
} from "src/lib/auth-request";

export async function GET(request: NextRequest) {
  try {
    const verified = await getVerifiedUserFromRequest(request);

    if ("error" in verified) {
      if (verified.error.status === 503) {
        const displayIdentity = getDisplayIdentityFromCookies(request);

        return NextResponse.json(
          {
            isAuthenticated: Boolean(displayIdentity),
            username: displayIdentity?.username ?? null,
            userId: displayIdentity ? String(displayIdentity.userId) : null,
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
          rateLimited: false,
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
        rateLimited: false,
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
      rateLimited: false,
    });
  }
}
