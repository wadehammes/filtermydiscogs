import { type NextRequest, NextResponse } from "next/server";
import { createErrorResponse } from "src/lib/api-helpers";
import { applyUserEmailVerificationToken } from "src/lib/applyUserEmailVerification.server";
import { hashEmailVerificationToken } from "src/lib/user-email-verification.server";
import { getSiteUrl } from "src/utils/helpers";

const settingsAccountVerifiedUrl = (
  status: "success" | "expired" | "invalid",
) =>
  new URL(
    `/settings?section=account&emailVerification=${status}`,
    getSiteUrl(),
  );

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";

    if (token === "") {
      return NextResponse.redirect(settingsAccountVerifiedUrl("invalid"));
    }

    const result = await applyUserEmailVerificationToken(
      hashEmailVerificationToken(token),
    );

    if (!result.ok) {
      return NextResponse.redirect(settingsAccountVerifiedUrl(result.reason));
    }

    return NextResponse.redirect(settingsAccountVerifiedUrl("success"));
  } catch (error) {
    return createErrorResponse(error, {
      route: "/api/user/email-verification/confirm",
    });
  }
}
