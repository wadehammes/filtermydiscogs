import { FetchMethods, fetchOptions, fetchResponse } from "src/api/helpers";
import type { DonationCheckoutReturnTo } from "src/constants/donate.constants";
import type {
  DonateCheckoutBody,
  DonateCheckoutResponse,
} from "src/lib/validation/donate.schemas";

type CreateDonateCheckoutSessionOptions = {
  amountCents: DonateCheckoutBody["amountCents"];
  returnTo?: DonationCheckoutReturnTo;
};

export const createDonateCheckoutSession = async ({
  amountCents,
  returnTo,
}: CreateDonateCheckoutSessionOptions): Promise<DonateCheckoutResponse> => {
  return fetchResponse<DonateCheckoutResponse>(
    fetch(
      "/api/donate/checkout",
      fetchOptions({
        method: FetchMethods.Post,
        body: JSON.stringify({ amountCents, returnTo }),
      }),
    ),
  );
};
