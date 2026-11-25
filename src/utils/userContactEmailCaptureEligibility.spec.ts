import { describe, expect, it } from "@jest/globals";
import { defaultUserContact } from "src/utils/userContact.helpers";
import {
  isUserContactMissingSavedEmail,
  shouldOfferEmailAccountCaptureToast,
} from "src/utils/userContactEmailCaptureEligibility";

describe("userContactEmailCaptureEligibility", () => {
  const missingContact = defaultUserContact();

  it("isUserContactMissingSavedEmail when email is saved, returns false", () => {
    expect(
      isUserContactMissingSavedEmail({
        ...defaultUserContact(),
        email: "dig@example.com",
        emailVerified: true,
      }),
    ).toBe(false);
  });

  it("isUserContactMissingSavedEmail when pending email is set, returns false", () => {
    expect(
      isUserContactMissingSavedEmail({
        ...defaultUserContact(),
        pendingEmail: "pending@example.com",
      }),
    ).toBe(false);
  });

  it("isUserContactMissingSavedEmail when email and pending are empty, returns true", () => {
    expect(isUserContactMissingSavedEmail(defaultUserContact())).toBe(true);
  });

  it("shouldOfferEmailAccountCaptureToast when contact is missing and user is eligible, returns true", () => {
    expect(
      shouldOfferEmailAccountCaptureToast({
        isAuthenticated: true,
        userId: "42",
        contact: missingContact,
        contactReady: true,
        dismissedForUser: false,
      }),
    ).toBe(true);
  });

  it("shouldOfferEmailAccountCaptureToast when the toast was dismissed, returns false", () => {
    expect(
      shouldOfferEmailAccountCaptureToast({
        isAuthenticated: true,
        userId: "42",
        contact: missingContact,
        contactReady: true,
        dismissedForUser: true,
      }),
    ).toBe(false);
  });

  it("shouldOfferEmailAccountCaptureToast when the user already saved an email, returns false", () => {
    expect(
      shouldOfferEmailAccountCaptureToast({
        isAuthenticated: true,
        userId: "42",
        contact: {
          ...missingContact,
          email: "have@example.com",
          emailVerified: true,
        },
        contactReady: true,
        dismissedForUser: false,
      }),
    ).toBe(false);
  });
});
