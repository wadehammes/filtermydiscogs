import "server-only";

import {
  buildWelcomeSignupEmailClaimWhere,
  isWelcomeSignupEmailEligibleAccount,
} from "src/constants/welcomeSignupEmail.constants";
import { prisma } from "src/lib/db";
import { renderWelcomeSignupEmail } from "src/lib/renderWelcomeSignupEmail.server";
import {
  getResendClient,
  getResendFromEmail,
  sendResendEmail,
} from "src/lib/resend.server";
import { reportTaggedAppError } from "src/lib/sentry/reportTaggedAppError.server";

let reportedWelcomeResendNotConfigured = false;

const reportWelcomeResendNotConfiguredOnce = (): void => {
  if (reportedWelcomeResendNotConfigured) {
    return;
  }
  reportedWelcomeResendNotConfigured = true;
  reportTaggedAppError(
    { area: "welcome_email", kind: "resend_not_configured" },
    new Error(
      "Welcome email skipped: RESEND_API_KEY or RESEND_FROM_EMAIL missing",
    ),
  );
};

export const sendWelcomeSignupEmailIfEligible = async (
  discogsUserId: number,
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { discogs_user_id: discogsUserId },
    select: {
      email: true,
      email_verified_at: true,
      username: true,
      welcome_email_sent: true,
      created_at: true,
    },
  });

  if (user == null || !isWelcomeSignupEmailEligibleAccount(user)) {
    return;
  }

  const resend = getResendClient();
  const from = getResendFromEmail();

  if (!(resend && from)) {
    reportWelcomeResendNotConfiguredOnce();
    return;
  }

  const trimmedEmail = user.email?.trim() ?? "";

  const claimed = await prisma.user.updateMany({
    where: buildWelcomeSignupEmailClaimWhere(discogsUserId),
    data: {
      welcome_email_sent: true,
    },
  });

  if (claimed.count === 0) {
    return;
  }

  const { subject, text, html } = await renderWelcomeSignupEmail({
    username: user.username,
  });

  try {
    await sendResendEmail(resend, {
      from,
      to: trimmedEmail,
      subject,
      text,
      html,
    });
  } catch (error) {
    await prisma.user.update({
      where: { discogs_user_id: discogsUserId },
      data: { welcome_email_sent: false },
    });
    throw error;
  }
};
