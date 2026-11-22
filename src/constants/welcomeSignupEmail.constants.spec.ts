import { describe, expect, it } from "@jest/globals";
import {
  isWelcomeSignupEmailEligibleAccount,
  WELCOME_EMAIL_NEW_ACCOUNT_MIN_CREATED_AT,
} from "src/constants/welcomeSignupEmail.constants";

describe("isWelcomeSignupEmailEligibleAccount", () => {
  const baseUser = {
    welcome_email_sent: false,
    email: "dig@example.com",
    login_count: 1,
    created_at: new Date("2026-11-22T18:00:00.000Z"),
  };

  it("is eligible for a first-login account created after the rollout cutoff", () => {
    expect(isWelcomeSignupEmailEligibleAccount(baseUser)).toBe(true);
  });

  it("is not eligible when login_count is above the first signup", () => {
    expect(
      isWelcomeSignupEmailEligibleAccount({ ...baseUser, login_count: 2 }),
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
