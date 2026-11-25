import { EMAIL_VERIFICATION_TTL_MS } from "src/constants/emailVerification.constants";
import { SITE_DOMAIN_LABEL, SITE_NAME } from "src/constants/siteMetadata";

export const USER_EMAIL_VERIFICATION_SUBJECT = `Verify your email for ${SITE_DOMAIN_LABEL}`;

const verificationExpiryHours = EMAIL_VERIFICATION_TTL_MS / (60 * 60 * 1000);

export const buildUserEmailVerificationPreview = (): string =>
  `Confirm this address for your ${SITE_NAME} account.`;

export const userEmailVerificationCopy = {
  body: `You added or changed your contact email in Settings. Confirm the link below so we can use this address on your ${SITE_NAME} account.`,
  ctaVerify: "Verify email",
  expiryNote: `This link expires in ${verificationExpiryHours} hours.`,
  ignoreNote: "If you did not request this, you can ignore this message.",
} as const;