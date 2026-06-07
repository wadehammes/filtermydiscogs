import { type NextRequest, NextResponse } from "next/server";
import { getVerifiedUserFromRequest } from "src/lib/auth-request";

export async function GET(request: NextRequest) {
  try {
    const verified = await getVerifiedUserFromRequest(request);

    if ("error" in verified) {
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
