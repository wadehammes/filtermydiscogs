import "server-only";

import type { ReactElement } from "react";
import { render } from "react-email";
import { WelcomeSignupEmailTemplate } from "src/components/Email/WelcomeSignupEmailTemplate.component";
import { WELCOME_SIGNUP_EMAIL_SUBJECT } from "src/constants/welcomeSignupEmailCopy.constants";
import { getEmailBaseUrl } from "src/lib/emailConstants";

export type RenderedWelcomeSignupEmail = {
  subject: string;
  html: string;
  text: string;
};

const renderEmail = async (
  template: ReactElement,
): Promise<Pick<RenderedWelcomeSignupEmail, "html" | "text">> => {
  const [html, text] = await Promise.all([
    render(template),
    render(template, { plainText: true }),
  ]);

  return { html, text };
};

export const renderWelcomeSignupEmail = async ({
  username,
}: {
  username: string;
}): Promise<RenderedWelcomeSignupEmail> => {
  const baseUrl = getEmailBaseUrl();
  const { html, text } = await renderEmail(
    <WelcomeSignupEmailTemplate baseUrl={baseUrl} username={username} />,
  );

  return {
    subject: WELCOME_SIGNUP_EMAIL_SUBJECT,
    html,
    text,
  };
};
