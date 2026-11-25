import { describe, expect, it } from "@jest/globals";
import {
  canResendEmailVerification,
  resolveEmailVerificationResendTarget,
} from "src/utils/userContactVerification";

describe("resolveEmailVerificationResendTarget", () => {
  it("returns the pending address when one is set", () => {
    expect(
      resolveEmailVerificationResendTarget({
        email: "old@example.com",
        pendingEmail: "new@example.com",
        emailVerified: false,
        marketingEmailsOptIn: false,
      }),
    ).toBe("new@example.com");
  });

  it("returns the saved address when it is unverified and not pending", () => {
    expect(
      resolveEmailVerificationResendTarget({
        email: "legacy@example.com",
        pendingEmail: null,
        emailVerified: false,
        marketingEmailsOptIn: false,
      }),
    ).toBe("legacy@example.com");
  });

  it("returns null when there is nothing to verify", () => {
    expect(
      resolveEmailVerificationResendTarget({
        email: null,
        pendingEmail: null,
        emailVerified: false,
        marketingEmailsOptIn: false,
      }),
    ).toBeNull();
    expect(
      resolveEmailVerificationResendTarget({
        email: "done@example.com",
        pendingEmail: null,
        emailVerified: true,
        marketingEmailsOptIn: true,
      }),
    ).toBeNull();
  });
});

describe("canResendEmailVerification", () => {
  it("is true when a resend target exists", () => {
    expect(
      canResendEmailVerification({
        email: null,
        pendingEmail: "new@example.com",
        emailVerified: false,
        marketingEmailsOptIn: false,
      }),
    ).toBe(true);
  });
});
