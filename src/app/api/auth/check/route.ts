import type { NextRequest } from "next/server";
import {
  getDisplayIdentityFromCookies,
  getVerifiedUserFromRequest,
} from "src/lib/auth-request";
import { privateRouteJson } from "src/lib/private-route-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const verified = await getVerifiedUserFromRequest(request);

    if ("error" in verified) {
      if (verified.error.status === 503) {
        const displayIdentity = getDisplayIdentityFromCookies(request);

        return privateRouteJson(
          {
            isAuthenticated: Boolean(displayIdentity),
            username: displayIdentity?.username ?? null,
            userId: displayIdentity ? String(displayIdentity.userId) : null,
            rateLimited: true,
          },
          {
            headers: { "Retry-After": "60" },
          },
        );
      }

      return privateRouteJson({
        isAuthenticated: false,
        username: null,
        userId: null,
        rateLimited: false,
      });
    }

    return privateRouteJson({
      isAuthenticated: true,
      username: verified.user.username,
      userId: String(verified.user.userId),
      rateLimited: false,
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return privateRouteJson({
      isAuthenticated: false,
      username: null,
      userId: null,
      rateLimited: false,
    });
  }
}
