import type {
  UserContact,
  UserContactPatch,
} from "src/types/userContact.types";

export const normalizeContactEmailForCompare = (
  email: string | null | undefined,
): string | null => {
  if (email == null || email.trim() === "") {
    return null;
  }

  return email.trim().toLowerCase();
};

export const normalizeContactEmail = (
  email: string | null | undefined,
): string | null | undefined => {
  if (email === undefined) {
    return undefined;
  }

  if (email === null || email.trim() === "") {
    return null;
  }

  return email.trim();
};

export const defaultUserContact = (): UserContact => ({
  email: null,
  pendingEmail: null,
  emailVerified: false,
  marketingEmailsOptIn: false,
});

export const contactEmailsMatch = (
  a: string | null | undefined,
  b: string | null | undefined,
): boolean =>
  normalizeContactEmailForCompare(a) === normalizeContactEmailForCompare(b);

export const mergeUserContactPatch = (
  current: UserContact,
  patch: UserContactPatch,
): { contact: UserContact; error?: string } => {
  const normalizedPatchEmail = normalizeContactEmail(patch.email);
  const nextEmail =
    normalizedPatchEmail === undefined
      ? current.email
      : (normalizedPatchEmail ?? null);
  const nextMarketing =
    patch.marketingEmailsOptIn ?? current.marketingEmailsOptIn;

  if (nextMarketing && !current.emailVerified) {
    return {
      contact: current,
      error: "Verify your email before opting in to marketing emails",
    };
  }

  if (nextMarketing && !nextEmail) {
    return {
      contact: current,
      error: "Add an email address before opting in to marketing emails",
    };
  }

  return {
    contact: {
      email: nextEmail,
      pendingEmail: current.pendingEmail,
      emailVerified: current.emailVerified,
      marketingEmailsOptIn: nextMarketing,
    },
  };
};

export const shouldStartEmailVerification = (
  current: UserContact,
  nextEmail: string | null,
): nextEmail is string => {
  if (nextEmail == null) {
    return false;
  }

  if (contactEmailsMatch(current.pendingEmail, nextEmail)) {
    return false;
  }

  if (contactEmailsMatch(current.email, nextEmail) && current.emailVerified) {
    return false;
  }

  return true;
};
