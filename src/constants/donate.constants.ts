import { SUPPORT_PROJECT_ABOUT_PATH } from "src/constants/supportProjectToast.constants";

export const DONATION_PRESET_AMOUNTS_CENTS = [500, 1000, 2500] as const;

export const DONATION_MIN_CENTS = 100;

export const DONATION_MAX_CENTS = 1_000_000;

export const DONATION_MIN_DOLLARS = DONATION_MIN_CENTS / 100;

export const DONATION_MAX_DOLLARS = DONATION_MAX_CENTS / 100;

export const isDonationPresetAmount = (
  amountCents: number,
): amountCents is (typeof DONATION_PRESET_AMOUNTS_CENTS)[number] =>
  (DONATION_PRESET_AMOUNTS_CENTS as readonly number[]).includes(amountCents);

export const DONATION_SUCCESS_QUERY_PARAM = "donated";

export const DONATION_SUCCESS_QUERY_VALUE = "1";

export const DONATION_PRODUCT = {
  name: "Support FilterMyDiscogs",
  description:
    "Thank you for helping keep FilterMyDiscogs free and the roadmap moving.",
};

export const getDonateCheckoutUrls = (siteUrl: string) => ({
  successUrl: `${siteUrl}/about?${DONATION_SUCCESS_QUERY_PARAM}=${DONATION_SUCCESS_QUERY_VALUE}#support`,
  cancelUrl: `${siteUrl}${SUPPORT_PROJECT_ABOUT_PATH}`,
});

export const getDonateRequestSiteUrl = (request: {
  headers: { get(name: string): string | null };
  nextUrl: { origin: string };
}): string => {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    request.headers.get("origin") ||
    request.nextUrl.origin
  );
};
