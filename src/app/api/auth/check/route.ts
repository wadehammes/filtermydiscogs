import type { NextRequest } from "next/server";
import {
  getDisplayIdentityFromCookies,
  getStoredReconnectUsername,
  getVerifiedUserFromRequest,
  getVerifiedUserFromStoredTokens,
} from "src/lib/auth-request";
import { enforceAuthRouteIpRateLimit } from "src/lib/auth-route-guards";
import { privateRouteJson } from "src/lib/private-route-response";
import { rethrowNextInternalError } from "src/lib/rethrowNextInternalError";

async function resolveReconnectUsername(
  request: NextRequest,
): Promise<string | null> {
  const reconnectUsername = getStoredReconnectUsername(request);
  if (reconnectUsername) {
    return reconnectUsername;
  }

  const stored = await getVerifiedUserFromStoredTokens(request);
  if ("error" in stored) {
    return null;
  }

  return stored.user.username;
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = enforceAuthRouteIpRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

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
            reconnectUsername: null,
          },
          {
            headers: { "Retry-After": "60" },
          },
        );
      }

      const reconnectUsername = await resolveReconnectUsername(request);

      return privateRouteJson({
        isAuthenticated: false,
        username: null,
        userId: null,
        rateLimited: false,
        reconnectUsername,
      });
    }

    return privateRouteJson({
      isAuthenticated: true,
      username: verified.user.username,
      userId: String(verified.user.userId),
      rateLimited: false,
      reconnectUsername: null,
    });
  } catch (error) {
    rethrowNextInternalError(error);
    console.error("Auth check error:", error);
    return privateRouteJson({
      isAuthenticated: false,
      username: null,
      userId: null,
      rateLimited: false,
      reconnectUsername: null,
    });
  }
}
