import { describe, expect, it } from "@jest/globals";
import {
  DONATION_MAX_CENTS,
  DONATION_MIN_CENTS,
} from "src/constants/donate.constants";
import {
  donateAmountCentsSchema,
  donateCheckoutBodySchema,
  parseCustomDonationDollarsToCents,
} from "src/lib/validation/donate.schemas";

describe("donateAmountCentsSchema", () => {
  it("accepts amounts within the donation limits", () => {
    expect(donateAmountCentsSchema.safeParse(DONATION_MIN_CENTS).success).toBe(
      true,
    );
    expect(donateAmountCentsSchema.safeParse(DONATION_MAX_CENTS).success).toBe(
      true,
    );
  });

  it("rejects amounts below the minimum or above the maximum", () => {
    expect(
      donateAmountCentsSchema.safeParse(DONATION_MIN_CENTS - 1).success,
    ).toBe(false);
    expect(
      donateAmountCentsSchema.safeParse(DONATION_MAX_CENTS + 1).success,
    ).toBe(false);
  });

  it("rejects non-integer cent amounts", () => {
    expect(donateAmountCentsSchema.safeParse(10.5).success).toBe(false);
  });
});

describe("donateCheckoutBodySchema", () => {
  it("accepts a valid checkout body", () => {
    expect(
      donateCheckoutBodySchema.safeParse({ amountCents: 500 }).success,
    ).toBe(true);
  });
});

describe("parseCustomDonationDollarsToCents", () => {
  it("when the input is blank, returns 0", () => {
    expect(parseCustomDonationDollarsToCents("")).toBe(0);
    expect(parseCustomDonationDollarsToCents("   ")).toBe(0);
  });

  it("when the input is not numeric, returns 0", () => {
    expect(parseCustomDonationDollarsToCents("abc")).toBe(0);
  });

  it("parses trimmed dollar strings into rounded cents", () => {
    expect(parseCustomDonationDollarsToCents(" 12.34 ")).toBe(1234);
    expect(parseCustomDonationDollarsToCents("2.55")).toBe(255);
  });
});
