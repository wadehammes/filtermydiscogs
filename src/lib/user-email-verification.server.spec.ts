import { describe, expect, it } from "@jest/globals";
import {
  buildEmailVerificationChallenge,
  buildEmailVerificationConfirmUrl,
  hashEmailVerificationToken,
  isEmailVerificationExpired,
  normalizeContactEmailForCompare,
} from "src/lib/user-email-verification.server";

describe("normalizeContactEmailForCompare", () => {
  it("trims and lowercases stored addresses", () => {
    expect(normalizeContactEmailForCompare("  Dig@Example.COM ")).toBe(
      "dig@example.com",
    );
  });

  it("returns null for blank addresses", () => {
    expect(normalizeContactEmailForCompare("   ")).toBeNull();
    expect(normalizeContactEmailForCompare(null)).toBeNull();
  });
});

describe("email verification token helpers", () => {
  it("hashes tokens deterministically", () => {
    const hashA = hashEmailVerificationToken("abc");
    const hashB = hashEmailVerificationToken("abc");
    const hashC = hashEmailVerificationToken("def");

    expect(hashA).toBe(hashB);
    expect(hashA).not.toBe(hashC);
  });

  it("builds a challenge with a future expiry", () => {
    const { token, tokenHash, expiresAt } = buildEmailVerificationChallenge();

    expect(token.length).toBeGreaterThan(20);
    expect(tokenHash).toBe(hashEmailVerificationToken(token));
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("builds confirm URLs on the API path", () => {
    const url = buildEmailVerificationConfirmUrl(
      "token-value",
      "https://www.filtermydisco.gs",
    );

    expect(url).toBe(
      "https://www.filtermydisco.gs/api/user/email-verification/confirm?token=token-value",
    );
  });

  it("treats missing or past expiries as expired", () => {
    const now = Date.parse("2010-01-01T00:00:00.000Z");

    expect(isEmailVerificationExpired(null, now)).toBe(true);
    expect(
      isEmailVerificationExpired(new Date("2000-01-01T00:00:00.000Z"), now),
    ).toBe(true);
    expect(
      isEmailVerificationExpired(new Date("2099-01-01T00:00:00.000Z"), now),
    ).toBe(false);
  });
});
