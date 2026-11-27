import "server-only";

import { ABOUT_SUPPORT_EMAIL } from "src/constants/about.constants";
import {
  renderBugReportReceivedEmail,
  renderBugReportSupportEmail,
} from "src/lib/renderBugReportEmails.server";
import {
  getResendClient,
  getResendFromEmail,
  reportResendNotConfiguredOnce,
  sendResendEmail,
} from "src/lib/resend.server";
import { definedProps } from "src/utils/definedProps";

export type SendBugReportNotificationEmailsInput = {
  message: string;
  feedbackSourceTag?: string;
  reporterName?: string;
  reporterEmail?: string;
  username?: string;
  discogsUserId?: string;
};

const readReporterEmail = (reporterEmail?: string): string | null => {
  const trimmed = reporterEmail?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

export const sendBugReportNotificationEmails = async (
  input: SendBugReportNotificationEmailsInput,
): Promise<void> => {
  const resend = getResendClient();
  const from = getResendFromEmail();

  if (!(resend && from)) {
    reportResendNotConfiguredOnce({
      area: "bug_report_email",
      kind: "resend_not_configured",
      message:
        "Bug report notification skipped: RESEND_API_KEY or RESEND_FROM_EMAIL missing",
    });
    return;
  }

  const reporterEmail = readReporterEmail(input.reporterEmail);
  const supportEmail = ABOUT_SUPPORT_EMAIL;

  const supportRendered = await renderBugReportSupportEmail({
    message: input.message,
    ...definedProps({
      feedbackSourceTag: input.feedbackSourceTag,
      reporterName: input.reporterName,
      reporterEmail: reporterEmail ?? undefined,
      username: input.username,
      discogsUserId: input.discogsUserId,
    }),
  });

  await sendResendEmail(resend, {
    from,
    to: supportEmail,
    subject: supportRendered.subject,
    text: supportRendered.text,
    html: supportRendered.html,
    ...definedProps({
      replyTo: reporterEmail ?? undefined,
    }),
  });

  if (!reporterEmail) {
    return;
  }

  const receivedRendered = await renderBugReportReceivedEmail(
    definedProps({ username: input.username }),
  );

  await sendResendEmail(resend, {
    from,
    to: reporterEmail,
    subject: receivedRendered.subject,
    text: receivedRendered.text,
    html: receivedRendered.html,
  });
};
