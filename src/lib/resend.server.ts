import "server-only";

import { Resend } from "resend";

let resendClient: Resend | null = null;

export const getResendClient = (): Resend | null => {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  resendClient ??= new Resend(apiKey);

  return resendClient;
};

export const getResendFromEmail = (): string | null => {
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!from) {
    return null;
  }

  return from;
};
