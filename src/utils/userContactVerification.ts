import type { UserContact } from "src/types/userContact.types";

export const resolveEmailVerificationResendTarget = (
  current: UserContact,
): string | null => {
  const pending = current.pendingEmail?.trim() ?? "";
  if (pending !== "") {
    return current.pendingEmail;
  }

  const saved = current.email?.trim() ?? "";
  if (saved !== "" && !current.emailVerified) {
    return current.email;
  }

  return null;
};

export const canResendEmailVerification = (current: UserContact): boolean =>
  resolveEmailVerificationResendTarget(current) != null;