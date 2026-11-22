import { Img, Link, Section, Text } from "react-email";
import { emailClasses } from "src/components/Email/emailClasses";
import { SITE_NAME, SITE_WORDMARK } from "src/constants/siteMetadata";
import {
  EMAIL_ICON_PATH,
  getEmailAssetBaseUrl,
  getEmailBaseUrl,
} from "src/lib/emailConstants";

type EmailHeaderProps = {
  baseUrl?: string;
};

export const EmailHeader = ({
  baseUrl = getEmailBaseUrl(),
}: EmailHeaderProps) => {
  const iconUrl = `${getEmailAssetBaseUrl()}${EMAIL_ICON_PATH}`;

  return (
    <Section className="pb-2 pt-0 text-center">
      <Link className="no-underline" href={baseUrl}>
        <Img
          alt={SITE_NAME}
          className={emailClasses.icon}
          height={56}
          src={iconUrl}
          width={56}
        />
        <Text className={emailClasses.headerWordmark}>{SITE_WORDMARK}</Text>
      </Link>
    </Section>
  );
};
