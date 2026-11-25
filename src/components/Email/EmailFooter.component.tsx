import { Link, Section, Text } from "react-email";
import { emailClasses } from "src/components/Email/emailClasses";
import { emailContactCopy } from "src/constants/emailCopy.constants";
import { getEmailBaseUrl } from "src/lib/emailConstants";
import { emailFooterContactLink } from "src/utils/emailMailbox";

type EmailFooterProps = {
  baseUrl?: string;
  contactEmail?: string;
};

export const EmailFooter = ({
  baseUrl = getEmailBaseUrl(),
  contactEmail,
}: EmailFooterProps) => {
  const host = baseUrl.replace(/^https?:\/\//, "");
  const contactLink = contactEmail
    ? emailFooterContactLink(contactEmail)
    : null;

  return (
    <Section className={emailClasses.footerWrapper}>
      {contactLink ? (
        <Text className={`${emailClasses.footerText} mb-2`}>
          {emailContactCopy.contactLead}
          <Link className={emailClasses.link} href={contactLink.href}>
            {contactLink.label}
          </Link>
          {emailContactCopy.contactSuffix}
        </Text>
      ) : null}
      <Text className={emailClasses.footerText}>
        <Link className={emailClasses.link} href={baseUrl}>
          {host}
        </Link>
      </Text>
    </Section>
  );
};
