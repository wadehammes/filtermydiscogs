import { type NextRequest, NextResponse } from "next/server";
import {
  DONATION_PRODUCT,
  getDonateCheckoutUrls,
  getDonateRequestSiteUrl,
} from "src/constants/donate.constants";
import { checkIpRateLimit } from "src/lib/ip-rate-limit";
import { rethrowNextInternalError } from "src/lib/rethrowNextInternalError";
import { getStripeClient } from "src/lib/stripe.server";
import { donateCheckoutBodySchema } from "src/lib/validation/donate.schemas";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";

export async function POST(request: NextRequest) {
  const rateLimit = checkIpRateLimit(request);

  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const stripe = getStripeClient();

  if (!stripe) {
    return NextResponse.json(
      { error: "Donations are not configured" },
      { status: 503 },
    );
  }

  const parsedBody = await parseRequestBody(request, donateCheckoutBodySchema);

  if ("error" in parsedBody) {
    return NextResponse.json({ error: parsedBody.error }, { status: 400 });
  }

  const { amountCents } = parsedBody.data;
  const { successUrl, cancelUrl } = getDonateCheckoutUrls(
    getDonateRequestSiteUrl(request),
  );

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: DONATION_PRODUCT,
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    rethrowNextInternalError(error);
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to start checkout" },
      { status: 500 },
    );
  }
}
