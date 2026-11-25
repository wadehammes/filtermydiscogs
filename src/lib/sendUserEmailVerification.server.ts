import "server-only";

import { renderUserEmailVerificationEmail } from "src/lib/renderUserEmailVerificationEmail.server";
import {
  getResendClient,
  getResendFromEmail,
  reportResendNotConfiguredOnce,
  sendResendEmail,
} from "src/lib/resend.server";
import { buildEmailVerificationConfirmUrl } from "src/lib/user-email-verification.server";

export const sendUserEmailVerification = async (input: {
  to: string;
  token: string;
  siteOrigin: string;
}): Promise<void> => {
  const resend = getResendClient();
  const from = getResendFromEmail();

  if (!(resend && from)) {
    reportResendNotConfiguredOnce({
      area: "email_verification",
      kind: "resend_not_configured",
      message:
        "Verification email skipped: RESEND_API_KEY or RESEND_FROM_EMAIL missing",
    });
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
