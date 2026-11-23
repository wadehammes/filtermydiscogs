import { Button, Link, Section, Text } from "react-email";
import { EmailDivider } from "src/components/Email/EmailDivider.component";
import { EmailFooter } from "src/components/Email/EmailFooter.component";
import { EmailHeader } from "src/components/Email/EmailHeader.component";
import { EmailLayout } from "src/components/Email/EmailLayout.component";
import { emailClasses } from "src/components/Email/emailClasses";
import { SUPPORT_PROJECT_ABOUT_PATH } from "src/constants/supportProjectToast.constants";
import {
  buildWelcomeSignupEmailPreview,
  WELCOME_SIGNUP_EMAIL_SUBJECT,
  welcomeSignupEmailCopy,
} from "src/constants/welcomeSignupEmailCopy.constants";
import { getEmailBaseUrl } from "src/lib/emailConstants";
import { definedProps } from "src/utils/definedProps";

export type WelcomeSignupEmailTemplateProps = {
  baseUrl?: string;
  contactEmail?: string;
  username: string;
};

export const WelcomeSignupEmailTemplate = ({
  baseUrl = getEmailBaseUrl(),
  contactEmail,
  username,
}: WelcomeSignupEmailTemplateProps) => {
  const collectionUrl = `${baseUrl}/collection`;
  const settingsUrl = `${baseUrl}/settings?section=account`;
  const donateUrl = `${baseUrl}${SUPPORT_PROJECT_ABOUT_PATH}`;
  const preview = buildWelcomeSignupEmailPreview(username);

  return (
    <EmailLayout preview={preview} title={WELCOME_SIGNUP_EMAIL_SUBJECT}>
      <EmailHeader baseUrl={baseUrl} />

      <Section className={emailClasses.content}>
        <Text className={emailClasses.greeting}>
          {welcomeSignupEmailCopy.greeting(username)}
        </Text>
        <Text className={emailClasses.paragraph}>
          {welcomeSignupEmailCopy.body}
        </Text>

        <Section className="mb-6 text-center">
          <Button className={emailClasses.button} href={collectionUrl}>
            {welcomeSignupEmailCopy.ctaCollection}
          </Button>
        </Section>

        <Text
          className={`${emailClasses.muted} mb-4 mt-2 text-center text-xs leading-5`}
        >
          {welcomeSignupEmailCopy.syncNote}
        </Text>

        <Text className={emailClasses.muted}>
          {welcomeSignupEmailCopy.settingsNote}{" "}
          <Link className={emailClasses.link} href={settingsUrl}>
            {welcomeSignupEmailCopy.ctaSettings}
          </Link>
          .
        </Text>

        <EmailDivider />

        <Text
          className={`${emailClasses.muted} mb-2 text-center text-sm leading-6`}
        >
          {welcomeSignupEmailCopy.donateLeadPrefix}
          <Link className={emailClasses.link} href={donateUrl}>
            {welcomeSignupEmailCopy.donateLinkLabel}
          </Link>
          {welcomeSignupEmailCopy.donateLeadSuffix}
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

WelcomeSignupEmailTemplate.PreviewProps = {
  baseUrl: "https://www.filtermydisco.gs",
  contactEmail: "noise@filtermydiscogs",
  username: "crate-digger",
};

export default WelcomeSignupEmailTemplate;
