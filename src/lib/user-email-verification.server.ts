import "server-only";

import { createHash, randomBytes } from "node:crypto";
import {
  EMAIL_VERIFICATION_CONFIRM_PATH,
  EMAIL_VERIFICATION_TOKEN_BYTES,
  EMAIL_VERIFICATION_TTL_MS,
} from "src/constants/emailVerification.constants";
import { normalizeContactEmailForCompare } from "src/utils/userContact.helpers";

export { normalizeContactEmailForCompare };

export const hashEmailVerificationToken = (token: string): string =>
  createHash("sha256").update(token, "utf8").digest("hex");

export const createEmailVerificationToken = (): string =>
  randomBytes(EMAIL_VERIFICATION_TOKEN_BYTES).toString("base64url");

export const buildEmailVerificationChallenge = (): {
  token: string;
  tokenHash: string;
  expiresAt: Date;
} => {
  const token = createEmailVerificationToken();
  const tokenHash = hashEmailVerificationToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

  return { token, tokenHash, expiresAt };
};

export const buildEmailVerificationConfirmUrl = (
  token: string,
  siteOrigin: string,
): string => {
  const url = new URL(EMAIL_VERIFICATION_CONFIRM_PATH, siteOrigin);
  url.searchParams.set("token", token);

  return url.toString();
};

export const isEmailVerificationExpired = (
  expiresAt: Date | null | undefined,
  now = Date.now(),
): boolean => {
  if (expiresAt == null) {
    return true;
  }

  return expiresAt.getTime() <= now;
};
