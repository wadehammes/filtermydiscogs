import type { UserContact } from "src/types/userContact.types";
import { normalizeContactEmailForCompare } from "src/utils/userContact.helpers";

export const isUserContactMissingSavedEmail = (contact: UserContact): boolean =>
  [contact.email, contact.pendingEmail].every(
    (value) => normalizeContactEmailForCompare(value) == null,
  );

export const shouldOfferEmailAccountCaptureToast = (input: {
  isAuthenticated: boolean;
  userId: string | null;
  contact: UserContact | undefined;
  contactReady: boolean;
  dismissedForUser: boolean;
}): boolean => {
  if (!(input.isAuthenticated && input.userId && input.contactReady)) {
    return false;
  }

  if (input.dismissedForUser) {
    return false;
  }

  if (!input.contact) {
    return false;
  }

  return isUserContactMissingSavedEmail(input.contact);
};
