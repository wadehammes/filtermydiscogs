import { Link, Section, Text } from "react-email";
import { emailClasses } from "src/components/Email/emailClasses";
import { getEmailBaseUrl } from "src/lib/emailConstants";

type EmailFooterProps = {
  baseUrl?: string;
};

export const EmailFooter = ({
  baseUrl = getEmailBaseUrl(),
}: EmailFooterProps) => {
  const host = baseUrl.replace(/^https?:\/\//, "");

  return (
    <Section className={emailClasses.footerWrapper}>
      <Text className={emailClasses.footerText}>
        <Link className={emailClasses.link} href={baseUrl}>
          {host}
        </Link>
      </Text>
    </Section>
  );
};
