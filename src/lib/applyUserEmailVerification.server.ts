import "server-only";

import { logSanitizedApiRouteFailure } from "src/lib/api-helpers";
import { prisma } from "src/lib/db";
import { isEmailVerificationExpired } from "src/lib/user-email-verification.server";
import { sendWelcomeSignupEmailIfEligible } from "src/lib/welcomeSignupEmail.server";

export type ApplyEmailVerificationResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" };

export const applyUserEmailVerificationToken = async (
  tokenHash: string,
): Promise<ApplyEmailVerificationResult> => {
  const user = await prisma.user.findFirst({
    where: { email_verification_token_hash: tokenHash },
    select: {
      discogs_user_id: true,
      email_pending: true,
      email_verification_expires_at: true,
    },
  });

  if (user == null) {
    return { ok: false, reason: "invalid" };
  }

  const pendingEmail = user.email_pending?.trim() ?? "";

  if (pendingEmail === "") {
    return { ok: false, reason: "invalid" };
  }

  if (isEmailVerificationExpired(user.email_verification_expires_at)) {
    return { ok: false, reason: "expired" };
  }

  await prisma.user.update({
    where: { discogs_user_id: user.discogs_user_id },
    data: {
      email: pendingEmail,
      email_pending: null,
      email_verified_at: new Date(),
      email_verification_token_hash: null,
      email_verification_expires_at: null,
    },
  });

  const discogsUserId = user.discogs_user_id;
  void sendWelcomeSignupEmailIfEligible(discogsUserId).catch((error) =>
    logSanitizedApiRouteFailure(
      "/api/user/email-verification/confirm",
      error,
      "Welcome email after verification confirm failed:",
    ),
  );

  return { ok: true };
};
