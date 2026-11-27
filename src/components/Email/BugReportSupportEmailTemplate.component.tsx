import { Section, Text } from "react-email";
import { EmailFooter } from "src/components/Email/EmailFooter.component";
import { EmailHeader } from "src/components/Email/EmailHeader.component";
import { EmailLayout } from "src/components/Email/EmailLayout.component";
import { emailClasses } from "src/components/Email/emailClasses";
import {
  BUG_REPORT_SUPPORT_EMAIL_SUBJECT_PREFIX,
  bugReportSupportEmailCopy,
  buildBugReportSupportPreview,
} from "src/constants/bugReportEmailCopy.constants";
import { getEmailBaseUrl } from "src/lib/emailConstants";
import { definedProps } from "src/utils/definedProps";

export type BugReportSupportEmailTemplateProps = {
  baseUrl?: string;
  contactEmail?: string;
  message: string;
  feedbackSourceTag?: string;
  reporterName?: string;
  reporterEmail?: string;
  username?: string;
  discogsUserId?: string;
};

export const BugReportSupportEmailTemplate = ({
  baseUrl = getEmailBaseUrl(),
  contactEmail,
  message,
  feedbackSourceTag,
  reporterName,
  reporterEmail,
  username,
  discogsUserId,
}: BugReportSupportEmailTemplateProps) => {
  const preview = buildBugReportSupportPreview(feedbackSourceTag, username);
  const title = BUG_REPORT_SUPPORT_EMAIL_SUBJECT_PREFIX;

  return (
    <EmailLayout preview={preview} title={title}>
      <EmailHeader baseUrl={baseUrl} />

      <Section className={emailClasses.content}>
        {username ? (
          <Text className={emailClasses.paragraph}>
            {bugReportSupportEmailCopy.discogsUserLabel}: {username}
            {discogsUserId ? ` (${discogsUserId})` : null}
          </Text>
        ) : null}
        {reporterName ? (
          <Text className={emailClasses.paragraph}>
            {bugReportSupportEmailCopy.nameLabel}: {reporterName}
          </Text>
        ) : null}
        {reporterEmail ? (
          <Text className={emailClasses.paragraph}>
            {bugReportSupportEmailCopy.replyToLabel}: {reporterEmail}
          </Text>
        ) : null}
        {feedbackSourceTag ? (
          <Text className={emailClasses.paragraph}>
            {bugReportSupportEmailCopy.sourceLabel}: {feedbackSourceTag}
          </Text>
        ) : null}
        <Text className={emailClasses.paragraph}>
          {bugReportSupportEmailCopy.reportHeading}
        </Text>
        <Text className={`${emailClasses.paragraph} whitespace-pre-wrap`}>
          {message}
        </Text>
      </Section>

      <EmailFooter
        {...definedProps({
          baseUrl,
          ...(contactEmail ? { contactEmail } : {}),
        })}
      />
    </EmailLayout>
  );
};

BugReportSupportEmailTemplate.PreviewProps = {
  baseUrl: "https://www.filtermydisco.gs",
  contactEmail: "noise@filtermydiscogs",
  message: "Preview: command palette preview count looks wrong.",
  feedbackSourceTag: "collection_command",
  reporterName: "Wax",
  reporterEmail: "wax@example.com",
  username: "crate-digger",
  discogsUserId: "42",
};

export default BugReportSupportEmailTemplate;
