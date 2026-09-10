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
import {
  consumeSupportProjectToastPending,
  touchUserLastSeen,
} from "src/lib/user.server";
import { resolveDiscogsAvatarUrl } from "src/lib/user-profile.server";

type AuthCheckPayload = {
  isAuthenticated: boolean;
  username: string | null;
  userId: string | null;
  avatarUrl: string | null;
  rateLimited: boolean;
  reconnectUsername: string | null;
  showSupportProjectToast: boolean;
};

const AUTH_CHECK_DEFAULTS = {
  username: null,
  userId: null,
  avatarUrl: null,
  rateLimited: false,
  reconnectUsername: null,
  showSupportProjectToast: false,
} satisfies Omit<AuthCheckPayload, "isAuthenticated">;

function authCheckResponse(
  payload: Partial<AuthCheckPayload> &
    Pick<AuthCheckPayload, "isAuthenticated">,
  init?: ResponseInit,
) {
  return privateRouteJson({ ...AUTH_CHECK_DEFAULTS, ...payload }, init);
}

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

        return authCheckResponse(
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

      const reconnectUsername = await resolveReconnectUsername(request);

      return authCheckResponse({
        isAuthenticated: false,
        reconnectUsername,
      });
    }

    const [showSupportProjectToast, avatarUrl] = await Promise.all([
      consumeSupportProjectToastPending(verified.user.userId),
      resolveDiscogsAvatarUrl(request, verified.user),
    ]);
    void touchUserLastSeen(verified.user.userId);

    return authCheckResponse({
      isAuthenticated: true,
      username: verified.user.username,
      userId: String(verified.user.userId),
      avatarUrl,
      showSupportProjectToast,
    });
  } catch (error) {
    rethrowNextInternalError(error);
    console.error("Auth check error:", error);
    return authCheckResponse({ isAuthenticated: false });
  }
}
