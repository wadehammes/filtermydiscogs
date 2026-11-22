import type {
  UserContact,
  UserContactPatch,
} from "src/types/userContact.types";

const normalizeEmail = (
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
  marketingEmailsOptIn: false,
});

export const readUserContactFromRow = (row: {
  email: string | null;
  marketing_emails_opt_in: boolean;
}): UserContact => ({
  email: row.email,
  marketingEmailsOptIn: row.marketing_emails_opt_in,
});

export const mergeUserContactPatch = (
  current: UserContact,
  patch: UserContactPatch,
): { contact: UserContact; error?: string } => {
  const normalizedPatchEmail = normalizeEmail(patch.email);
  const nextEmail =
    normalizedPatchEmail === undefined
      ? current.email
      : (normalizedPatchEmail ?? null);
  const nextMarketing =
    patch.marketingEmailsOptIn ?? current.marketingEmailsOptIn;

  if (nextMarketing && !nextEmail) {
    return {
      contact: current,
      error: "Add an email address before opting in to marketing emails",
    };
  }

  return {
    contact: {
      email: nextEmail,
      marketingEmailsOptIn: nextMarketing,
    },
  };
};
