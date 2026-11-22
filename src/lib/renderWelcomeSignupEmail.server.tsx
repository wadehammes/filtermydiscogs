import "server-only";

import { WelcomeSignupEmailTemplate } from "src/components/Email/WelcomeSignupEmailTemplate.component";
import { WELCOME_SIGNUP_EMAIL_SUBJECT } from "src/constants/welcomeSignupEmailCopy.constants";
import { getEmailBaseUrl } from "src/lib/emailConstants";
import { renderReactEmailHtmlAndText } from "src/lib/renderReactEmail";

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
  const { html, text } = await renderReactEmailHtmlAndText(
    <WelcomeSignupEmailTemplate baseUrl={baseUrl} username={username} />,
  );

  return {
    subject: WELCOME_SIGNUP_EMAIL_SUBJECT,
    html,
    text,
  };
};
