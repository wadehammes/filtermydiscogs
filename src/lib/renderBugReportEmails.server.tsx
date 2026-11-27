import "server-only";

import { BugReportReceivedEmailTemplate } from "src/components/Email/BugReportReceivedEmailTemplate.component";
import { BugReportSupportEmailTemplate } from "src/components/Email/BugReportSupportEmailTemplate.component";
import {
  BUG_REPORT_RECEIVED_EMAIL_SUBJECT,
  BUG_REPORT_SUPPORT_EMAIL_SUBJECT_PREFIX,
} from "src/constants/bugReportEmailCopy.constants";
import { getEmailBaseUrl } from "src/lib/emailConstants";
import { renderTransactionalEmail } from "src/lib/renderTransactionalEmail.server";
import { getResendReplyTo } from "src/lib/resend.server";
import { definedProps } from "src/utils/definedProps";

export type RenderBugReportReceivedEmailInput = {
  username?: string;
};

export const renderBugReportReceivedEmail = async (
  input: RenderBugReportReceivedEmailInput,
) => {
  const baseUrl = getEmailBaseUrl();
  const replyTo = getResendReplyTo();

  return renderTransactionalEmail(
    BUG_REPORT_RECEIVED_EMAIL_SUBJECT,
    <BugReportReceivedEmailTemplate
      baseUrl={baseUrl}
      {...definedProps({
        contactEmail: replyTo ?? undefined,
        username: input.username,
      })}
    />,
  );
};

export type RenderBugReportSupportEmailInput = {
  message: string;
  feedbackSourceTag?: string;
  reporterName?: string;
  reporterEmail?: string;
  username?: string;
  discogsUserId?: string;
};

export const renderBugReportSupportEmail = async (
  input: RenderBugReportSupportEmailInput,
) => {
  const baseUrl = getEmailBaseUrl();
  const replyTo = getResendReplyTo();

  const subjectParts = [BUG_REPORT_SUPPORT_EMAIL_SUBJECT_PREFIX];
  if (input.feedbackSourceTag) {
    subjectParts.push(`[${input.feedbackSourceTag}]`);
  }
  if (input.username) {
    subjectParts.push(`— ${input.username}`);
  }

  return renderTransactionalEmail(
    subjectParts.join(" "),
    <BugReportSupportEmailTemplate
      baseUrl={baseUrl}
      message={input.message}
      {...definedProps({
        contactEmail: replyTo ?? undefined,
        feedbackSourceTag: input.feedbackSourceTag,
        reporterName: input.reporterName,
        reporterEmail: input.reporterEmail,
        username: input.username,
        discogsUserId: input.discogsUserId,
      })}
    />,
  );
};
