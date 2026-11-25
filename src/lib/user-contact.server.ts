import type {
  UserContact,
  UserContactDbRow,
} from "src/types/userContact.types";
import {
  contactEmailsMatch,
  defaultUserContact,
  mergeUserContactPatch,
  normalizeContactEmail,
  shouldStartEmailVerification,
} from "src/utils/userContact.helpers";

export { resolveEmailVerificationResendTarget } from "src/utils/userContactVerification";

export {
  contactEmailsMatch,
  defaultUserContact,
  mergeUserContactPatch,
  normalizeContactEmail,
  shouldStartEmailVerification,
};

export const readUserContactFromRow = (row: UserContactDbRow): UserContact => ({
  email: row.email,
  pendingEmail: row.email_pending,
  emailVerified: row.email_verified_at != null,
  marketingEmailsOptIn: row.marketing_emails_opt_in,
});
