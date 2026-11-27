import { Section, Text } from "react-email";
import { EmailFooter } from "src/components/Email/EmailFooter.component";
import { EmailHeader } from "src/components/Email/EmailHeader.component";
import { EmailLayout } from "src/components/Email/EmailLayout.component";
import { emailClasses } from "src/components/Email/emailClasses";
import {
  BUG_REPORT_RECEIVED_EMAIL_SUBJECT,
  bugReportReceivedEmailCopy,
  buildBugReportReceivedPreview,
} from "src/constants/bugReportEmailCopy.constants";
import { getEmailBaseUrl } from "src/lib/emailConstants";
import { definedProps } from "src/utils/definedProps";

export type BugReportReceivedEmailTemplateProps = {
  baseUrl?: string;
  contactEmail?: string;
  username?: string;
};

export const BugReportReceivedEmailTemplate = ({
  baseUrl = getEmailBaseUrl(),
  contactEmail,
  username,
}: BugReportReceivedEmailTemplateProps) => {
  const preview = buildBugReportReceivedPreview(username);

  return (
    <EmailLayout preview={preview} title={BUG_REPORT_RECEIVED_EMAIL_SUBJECT}>
      <EmailHeader baseUrl={baseUrl} />

      <Section className={emailClasses.content}>
        <Text className={emailClasses.greeting}>
          {bugReportReceivedEmailCopy.greeting(username)}
        </Text>
        <Text className={emailClasses.paragraph}>
          {bugReportReceivedEmailCopy.body}
        </Text>
        <Text className={emailClasses.muted}>
          {bugReportReceivedEmailCopy.footnote}
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

BugReportReceivedEmailTemplate.PreviewProps = {
  baseUrl: "https://www.filtermydisco.gs",
  contactEmail: "noise@filtermydiscogs",
  username: "crate-digger",
};

export default BugReportReceivedEmailTemplate;
