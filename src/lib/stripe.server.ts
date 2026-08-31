import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export const getStripeClient = (): Stripe | null => {
  const apiKey = process.env.STRIPE_API_KEY;

  if (!apiKey) {
    return null;
  }

  stripeClient ??= new Stripe(apiKey);

  return stripeClient;
};
