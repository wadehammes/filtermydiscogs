import { FetchMethods, fetchOptions, fetchResponse } from "src/api/helpers";
import type {
  DonateCheckoutBody,
  DonateCheckoutResponse,
} from "src/lib/validation/donate.schemas";

export const createDonateCheckoutSession = async (
  amountCents: DonateCheckoutBody["amountCents"],
): Promise<DonateCheckoutResponse> => {
  return fetchResponse<DonateCheckoutResponse>(
    fetch(
      "/api/donate/checkout",
      fetchOptions({
        method: FetchMethods.Post,
        body: JSON.stringify({ amountCents }),
      }),
    ),
  );
};
