import {
  DONATION_MAX_CENTS,
  DONATION_MIN_CENTS,
} from "src/constants/donate.constants";
import { z } from "zod";

export const donateAmountCentsSchema = z
  .number()
  .int("Amount must be a whole number of cents")
  .min(DONATION_MIN_CENTS, "Minimum donation is $1")
  .max(DONATION_MAX_CENTS, "Maximum donation is $10,000");

export const donateCheckoutBodySchema = z.object({
  amountCents: donateAmountCentsSchema,
});

export const donateCheckoutFormSchema = z.object({
  amountCents: donateAmountCentsSchema,
  customAmountDollars: z.string(),
});

export type DonateCheckoutBody = z.infer<typeof donateCheckoutBodySchema>;

export type DonateCheckoutFormValues = z.infer<typeof donateCheckoutFormSchema>;

export type DonateCheckoutResponse = {
  url: string;
};

export const parseCustomDonationDollarsToCents = (value: string): number => {
  const trimmed = value.trim();

  if (!trimmed) {
    return 0;
  }

  const dollars = Number.parseFloat(trimmed);

  if (Number.isNaN(dollars)) {
    return 0;
  }

  return Math.round(dollars * 100);
};
