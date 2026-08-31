import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";

jest.mock("src/lib/stripe.server", () => ({
  getStripeClient: jest.fn(),
}));

type RouteModule = typeof import("src/app/api/donate/checkout/route");
type StripeServerModule = typeof import("src/lib/stripe.server");

let POST: RouteModule["POST"];
let mockGetStripeClient: jest.MockedFunction<
  StripeServerModule["getStripeClient"]
>;

const createRequest = (body: unknown) =>
  new NextRequest("http://localhost:6767/api/donate/checkout", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:6767",
    },
    body: JSON.stringify(body),
  });

beforeAll(async () => {
  const [routeModule, stripeServerModule] = await Promise.all([
    import("src/app/api/donate/checkout/route"),
    import("src/lib/stripe.server"),
  ]);

  POST = routeModule.POST;
  mockGetStripeClient = jest.mocked(stripeServerModule.getStripeClient);
});

describe("POST /api/donate/checkout", () => {
  beforeEach(() => {
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
  });

  it("returns 503 when Stripe is not configured", async () => {
    mockGetStripeClient.mockReturnValue(null);

    const response = await POST(createRequest({ amountCents: 1000 }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ error: "Donations are not configured" });
  });

  it("creates a checkout session for a preset amount", async () => {
    const create = jest.fn(async (_session: unknown) => ({
      url: "https://checkout.stripe.com/test-session",
    }));

    mockGetStripeClient.mockReturnValue({
      checkout: {
        sessions: {
          create,
        },
      },
    } as never);

    const response = await POST(createRequest({ amountCents: 1000 }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ url: "https://checkout.stripe.com/test-session" });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 1000,
            }),
          }),
        ],
        success_url: "http://localhost:6767/about?donated=1#support",
        cancel_url: "http://localhost:6767/about#support",
      }),
    );
  });

  it("creates a checkout session for a custom amount", async () => {
    const create = jest.fn(async (_session: unknown) => ({
      url: "https://checkout.stripe.com/custom-session",
    }));

    mockGetStripeClient.mockReturnValue({
      checkout: {
        sessions: {
          create,
        },
      },
    } as never);

    const response = await POST(createRequest({ amountCents: 1500 }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ url: "https://checkout.stripe.com/custom-session" });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 1500,
            }),
          }),
        ],
      }),
    );
  });

  it("rejects amounts below the minimum", async () => {
    mockGetStripeClient.mockReturnValue({
      checkout: {
        sessions: {
          create: jest.fn(),
        },
      },
    } as never);

    const response = await POST(createRequest({ amountCents: 50 }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Minimum donation is $1");
  });

  it("requires an amount", async () => {
    mockGetStripeClient.mockReturnValue({
      checkout: {
        sessions: {
          create: jest.fn(),
        },
      },
    } as never);

    const response = await POST(createRequest({}));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBeTruthy();
  });
});
