import { createElement } from "react";
import { Resend } from "resend";
import { WelcomeSignupEmailTemplate } from "../src/components/Email/WelcomeSignupEmailTemplate.component";
import { WELCOME_SIGNUP_EMAIL_SUBJECT } from "../src/constants/welcomeSignupEmailCopy.constants";
import { renderReactEmailHtmlAndText } from "../src/lib/renderReactEmail";

const DEFAULT_FROM = "onboarding@resend.dev";
const DEFAULT_TO = "delivered@resend.dev";

const main = async () => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() ?? DEFAULT_FROM;
  const to = process.env.RESEND_TEST_TO?.trim() ?? DEFAULT_TO;
  const username = process.env.RESEND_TEST_USERNAME?.trim() ?? "crate-digger";
  const baseUrl =
    process.env.EMAIL_ASSET_BASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ??
    "https://www.filtermydisco.gs";

  if (!apiKey) {
    console.error("Set RESEND_API_KEY in .env.local");
    process.exitCode = 1;
    return;
  }

  const template = createElement(WelcomeSignupEmailTemplate, {
    baseUrl,
    username,
  });
  const { html, text } = await renderReactEmailHtmlAndText(template);

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to,
    subject: WELCOME_SIGNUP_EMAIL_SUBJECT,
    html,
    text,
  });

  if (result.error) {
    console.error(JSON.stringify(result.error, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log(
    `Sent welcome test email to ${to} (id: ${result.data?.id ?? "unknown"})`,
  );
};

void main();
