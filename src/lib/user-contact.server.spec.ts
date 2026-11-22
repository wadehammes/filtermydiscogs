import { describe, expect, it } from "@jest/globals";
import { mergeUserContactPatch } from "src/lib/user-contact.server";

describe("mergeUserContactPatch", () => {
  it("when marketing opt-in is true without an email, returns an error", () => {
    const result = mergeUserContactPatch(
      { email: null, marketingEmailsOptIn: false },
      { marketingEmailsOptIn: true },
    );

    expect(result.error).toBe(
      "Add an email address before opting in to marketing emails",
    );
    expect(result.contact.marketingEmailsOptIn).toBe(false);
  });

  it("when email is cleared, allows marketing opt-in to turn off via patch", () => {
    const result = mergeUserContactPatch(
      { email: "dig@example.com", marketingEmailsOptIn: true },
      { email: "", marketingEmailsOptIn: false },
    );

    expect(result.error).toBeUndefined();
    expect(result.contact).toEqual({
      email: null,
      marketingEmailsOptIn: false,
    });
  });
});
