import "server-only";

import { WelcomeSignupEmailTemplate } from "src/components/Email/WelcomeSignupEmailTemplate.component";
import { WELCOME_SIGNUP_EMAIL_SUBJECT } from "src/constants/welcomeSignupEmailCopy.constants";
import { getEmailBaseUrl } from "src/lib/emailConstants";
import { renderTransactionalEmail } from "src/lib/renderTransactionalEmail.server";
import { getResendReplyTo } from "src/lib/resend.server";
import { definedProps } from "src/utils/definedProps";

export type RenderedWelcomeSignupEmail = {
  subject: string;
  html: string;
  text: string;
};

export const renderWelcomeSignupEmail = async ({
  username,
}: {
  username: string;
}): Promise<RenderedWelcomeSignupEmail> => {
  const baseUrl = getEmailBaseUrl();
  const replyTo = getResendReplyTo();

  return renderTransactionalEmail(
    WELCOME_SIGNUP_EMAIL_SUBJECT,
    <WelcomeSignupEmailTemplate
      {...definedProps({
        baseUrl,
        ...(replyTo ? { contactEmail: replyTo } : {}),
        username,
      })}
    />,
  );
};
