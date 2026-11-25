import type { NextRequest } from "next/server";
import { createErrorResponse } from "src/lib/api-helpers";
import { applyUserEmailVerificationToken } from "src/lib/applyUserEmailVerification.server";
import {
  EMAIL_VERIFICATION_CONFIRM_RATE_LIMIT_CONFIG,
  getIpRateLimitResponse,
} from "src/lib/ip-rate-limit";
import { privateRouteRedirect } from "src/lib/private-route-response";
import { hashEmailVerificationToken } from "src/lib/user-email-verification.server";

const settingsAccountVerifiedUrl = (
  origin: string,
  status: "success" | "expired" | "invalid",
) => new URL(`/settings?section=account&emailVerification=${status}`, origin);

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = getIpRateLimitResponse(
      request,
      EMAIL_VERIFICATION_CONFIRM_RATE_LIMIT_CONFIG,
    );

    if (rateLimitResponse != null) {
      return rateLimitResponse;
    }

    const redirectOrigin = request.nextUrl.origin;
    const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";

    if (token === "") {
      return privateRouteRedirect(
        settingsAccountVerifiedUrl(redirectOrigin, "invalid"),
      );
    }

    const result = await applyUserEmailVerificationToken(
      hashEmailVerificationToken(token),
    );

    if (!result.ok) {
      return privateRouteRedirect(
        settingsAccountVerifiedUrl(redirectOrigin, result.reason),
      );
    }

    return privateRouteRedirect(
      settingsAccountVerifiedUrl(redirectOrigin, "success"),
    );
  } catch (error) {
    return createErrorResponse(error, {
      route: "/api/user/email-verification/confirm",
    });
  }
}
