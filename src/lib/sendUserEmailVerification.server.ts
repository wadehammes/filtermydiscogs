import "server-only";

import { renderUserEmailVerificationEmail } from "src/lib/renderUserEmailVerificationEmail.server";
import {
  getResendClient,
  getResendFromEmail,
  sendResendEmail,
} from "src/lib/resend.server";
import { reportTaggedAppError } from "src/lib/sentry/reportTaggedAppError.server";
import { buildEmailVerificationConfirmUrl } from "src/lib/user-email-verification.server";

let reportedVerificationResendNotConfigured = false;

const reportVerificationResendNotConfiguredOnce = (): void => {
  if (reportedVerificationResendNotConfigured) {
    return;
  }
  reportedVerificationResendNotConfigured = true;
  reportTaggedAppError(
    { area: "email_verification", kind: "resend_not_configured" },
    new Error(
      "Verification email skipped: RESEND_API_KEY or RESEND_FROM_EMAIL missing",
    ),
  );
};

export const sendUserEmailVerification = async (input: {
  to: string;
  token: string;
  siteOrigin: string;
}): Promise<void> => {
  const resend = getResendClient();
  const from = getResendFromEmail();

  if (!(resend && from)) {
    reportVerificationResendNotConfiguredOnce();
    return;
  }

  const confirmUrl = buildEmailVerificationConfirmUrl(
    input.token,
    input.siteOrigin,
  );
  const { subject, text, html } = await renderUserEmailVerificationEmail({
    confirmUrl,
  });

  await sendResendEmail(resend, {
    from,
    to: input.to,
    subject,
    text,
    html,
  });
};
