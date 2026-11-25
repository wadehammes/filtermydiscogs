import { describe, expect, it } from "@jest/globals";
import {
  mergeUserContactPatch,
  shouldStartEmailVerification,
} from "src/utils/userContact.helpers";

describe("mergeUserContactPatch", () => {
  it("when marketing opt-in is true without a verified email, returns an error", () => {
    const result = mergeUserContactPatch(
      {
        email: "dig@example.com",
        pendingEmail: null,
        emailVerified: false,
        marketingEmailsOptIn: false,
      },
      { marketingEmailsOptIn: true },
    );

    expect(result.error).toBe(
      "Verify your email before opting in to marketing emails",
    );
    expect(result.contact.marketingEmailsOptIn).toBe(false);
  });

  it("when marketing opt-in is true with a verified email, succeeds", () => {
    const result = mergeUserContactPatch(
      {
        email: "dig@example.com",
        pendingEmail: null,
        emailVerified: true,
        marketingEmailsOptIn: false,
      },
      { marketingEmailsOptIn: true },
    );

    expect(result.error).toBeUndefined();
    expect(result.contact.marketingEmailsOptIn).toBe(true);
  });

  it("when email is cleared, allows marketing opt-in to turn off via patch", () => {
    const result = mergeUserContactPatch(
      {
        email: "dig@example.com",
        pendingEmail: null,
        emailVerified: true,
        marketingEmailsOptIn: true,
      },
      { email: "", marketingEmailsOptIn: false },
    );

    expect(result.error).toBeUndefined();
    expect(result.contact).toEqual({
      email: null,
      pendingEmail: null,
      emailVerified: true,
      marketingEmailsOptIn: false,
    });
  });
});

describe("shouldStartEmailVerification", () => {
  it("starts verification when the saved address changes", () => {
    expect(
      shouldStartEmailVerification(
        {
          email: "old@example.com",
          pendingEmail: null,
          emailVerified: true,
          marketingEmailsOptIn: false,
        },
        "new@example.com",
      ),
    ).toBe(true);
  });

  it("starts verification when the user adds an address for the first time", () => {
    expect(
      shouldStartEmailVerification(
        {
          email: null,
          pendingEmail: null,
          emailVerified: false,
          marketingEmailsOptIn: false,
        },
        "new@example.com",
      ),
    ).toBe(true);
  });

  it("does not restart verification when the pending address is resaved", () => {
    expect(
      shouldStartEmailVerification(
        {
          email: null,
          pendingEmail: "new@example.com",
          emailVerified: false,
          marketingEmailsOptIn: false,
        },
        "new@example.com",
      ),
    ).toBe(false);
  });
});
