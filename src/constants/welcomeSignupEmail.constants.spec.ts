import { describe, expect, it } from "@jest/globals";
import {
  isWelcomeSignupEmailEligibleAccount,
  WELCOME_EMAIL_NEW_ACCOUNT_MIN_CREATED_AT,
} from "src/constants/welcomeSignupEmail.constants";

describe("isWelcomeSignupEmailEligibleAccount", () => {
  const baseUser = {
    welcome_email_sent: false,
    email: "dig@example.com",
    email_verified_at: new Date("2026-11-22T18:00:00.000Z"),
    created_at: new Date("2026-11-22T18:00:00.000Z"),
  };

  it("is eligible when welcome was never sent and created_at is post-cutoff", () => {
    expect(isWelcomeSignupEmailEligibleAccount(baseUser)).toBe(true);
  });

  it("is not eligible until the email is verified", () => {
    expect(
      isWelcomeSignupEmailEligibleAccount({
        ...baseUser,
        email_verified_at: null,
      }),
    ).toBe(false);
  });

  it("is not eligible for accounts created before the rollout cutoff", () => {
    expect(
      isWelcomeSignupEmailEligibleAccount({
        ...baseUser,
        created_at: new Date(
          WELCOME_EMAIL_NEW_ACCOUNT_MIN_CREATED_AT.getTime() - 1,
        ),
      }),
    ).toBe(false);
  });
});
