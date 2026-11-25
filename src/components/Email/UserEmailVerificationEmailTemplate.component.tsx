import { Button, Link, Section, Text } from "react-email";
import { EmailFooter } from "src/components/Email/EmailFooter.component";
import { EmailHeader } from "src/components/Email/EmailHeader.component";
import { EmailLayout } from "src/components/Email/EmailLayout.component";
import { emailClasses } from "src/components/Email/emailClasses";
import { DEFAULT_SETTINGS_SECTION } from "src/components/Settings/settingsSections.constants";
import {
  buildUserEmailVerificationPreview,
  USER_EMAIL_VERIFICATION_SUBJECT,
  userEmailVerificationCopy,
} from "src/constants/userEmailVerificationCopy.constants";
import { getEmailBaseUrl } from "src/lib/emailConstants";
import { definedProps } from "src/utils/definedProps";

export type UserEmailVerificationEmailTemplateProps = {
  baseUrl?: string;
  confirmUrl: string;
  contactEmail?: string;
};

export const UserEmailVerificationEmailTemplate = ({
  baseUrl = getEmailBaseUrl(),
  confirmUrl,
  contactEmail,
}: UserEmailVerificationEmailTemplateProps) => {
  const settingsUrl = `${baseUrl}/settings?section=${DEFAULT_SETTINGS_SECTION}`;
  const preview = buildUserEmailVerificationPreview();

  return (
    <EmailLayout preview={preview} title={USER_EMAIL_VERIFICATION_SUBJECT}>
      <EmailHeader baseUrl={baseUrl} />

      <Section className={emailClasses.content}>
        <Text className={emailClasses.paragraph}>
          {userEmailVerificationCopy.body}
        </Text>

        <Section className="mb-6 text-center">
          <Button className={emailClasses.button} href={confirmUrl}>
            {userEmailVerificationCopy.ctaVerify}
          </Button>
        </Section>

        <Text
          className={`${emailClasses.muted} mb-4 mt-2 text-center text-xs leading-5`}
        >
          {userEmailVerificationCopy.expiryNote}
        </Text>

        <Text className={emailClasses.muted}>
          {userEmailVerificationCopy.ignoreNote} You can also confirm from{" "}
          <Link className={emailClasses.link} href={settingsUrl}>
            Account settings
          </Link>
          .
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

UserEmailVerificationEmailTemplate.PreviewProps = {
  baseUrl: "https://www.filtermydisco.gs",
  confirmUrl:
    "https://www.filtermydisco.gs/api/user/email-verification/confirm?token=preview",
  contactEmail: "noise@filtermydiscogs",
};

export default UserEmailVerificationEmailTemplate;