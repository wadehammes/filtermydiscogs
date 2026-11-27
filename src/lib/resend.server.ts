import "server-only";

import type { Resend } from "resend";
import { Resend as ResendClient } from "resend";
import { reportTaggedAppError } from "src/lib/sentry/reportTaggedAppError.server";

const reportedResendNotConfigured = new Set<string>();

export const reportResendNotConfiguredOnce = (input: {
  area: string;
  kind: string;
  message: string;
}): void => {
  const key = `${input.area}:${input.kind}`;

  if (reportedResendNotConfigured.has(key)) {
    return;
  }

  reportedResendNotConfigured.add(key);
  reportTaggedAppError(
    { area: input.area, kind: input.kind },
    new Error(input.message),
  );
};

let resendClient: Resend | null = null;

const readTrimmedEnv = (key: string): string | null => {
  const value = process.env[key]?.trim();

  if (!value) {
    return null;
  }

  return value;
};

export const getResendClient = (): Resend | null => {
  const apiKey = readTrimmedEnv("RESEND_API_KEY");

  if (!apiKey) {
    return null;
  }

  resendClient ??= new ResendClient(apiKey);

  return resendClient;
};

export const getResendFromEmail = (): string | null =>
  readTrimmedEnv("RESEND_FROM_EMAIL");

export const getResendReplyTo = (): string | null =>
  readTrimmedEnv("RESEND_REPLY_TO");

export const resendReplyToSendFields = (): { reply_to: string } | undefined => {
  const replyTo = getResendReplyTo();

  if (!replyTo) {
    return undefined;
  }

  return { reply_to: replyTo };
};

export type ResendSendEmailInput = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

export const sendResendEmail = async (
  resend: Resend,
  input: ResendSendEmailInput,
): Promise<void> => {
  let deliveryError: Error | null = null;

  try {
    const replyFields = input.replyTo
      ? { reply_to: input.replyTo }
      : resendReplyToSendFields();

    const result = await resend.emails.send({
      from: input.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      ...replyFields,
    });

    if (result.error) {
      deliveryError = new Error(
        result.error.message?.trim() || "Resend rejected the email",
      );
    }
  } catch (error) {
    deliveryError =
      error instanceof Error ? error : new Error("Resend send failed");
  }

  if (deliveryError != null) {
    throw deliveryError;
  }
};
