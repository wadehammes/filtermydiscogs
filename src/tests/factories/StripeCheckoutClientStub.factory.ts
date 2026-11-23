import type { jest } from "@jest/globals";
import type Stripe from "stripe";

export type StripeCheckoutSessionCreateMock = jest.Mock<
  (params: unknown) => Promise<{ url: string | null }>
>;

export type StripeCheckoutClientStub = {
  checkout: {
    sessions: {
      create: StripeCheckoutSessionCreateMock;
    };
  };
};

export const stripeCheckoutClientStubFactory = {
  build(create?: StripeCheckoutSessionCreateMock): StripeCheckoutClientStub {
    const sessionCreate =
      create ??
      (async () => ({
        url: "https://checkout.stripe.com/test-session",
      }));
    return {
      checkout: {
        sessions: {
          create: sessionCreate as StripeCheckoutSessionCreateMock,
        },
      },
    };
  },
};

export const asStripeClient = (stub: StripeCheckoutClientStub): Stripe =>
  stub as unknown as Stripe;
