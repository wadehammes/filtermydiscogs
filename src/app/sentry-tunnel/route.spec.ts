import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockTunnelPost = jest.fn<(request: Request) => Promise<Response>>();

jest.mock("@sentry/nextjs/tunnel", () => ({
  createSentryTunnelRoute: () => ({
    POST: (request: Request) => mockTunnelPost(request),
  }),
}));

jest.mock("src/lib/sentry/sentryInitOptions", () => ({
  resolveSentryDsn: () => "https://public@o0.ingest.sentry.io/0",
}));

describe("POST /sentry-tunnel", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockTunnelPost.mockResolvedValue(new Response(null, { status: 204 }));
    process.env.SENTRY_TUNNEL_MAX_BODY_BYTES = "5000";
  });

  it("returns 413 when the envelope exceeds the max body size", async () => {
    process.env.SENTRY_TUNNEL_MAX_BODY_BYTES = "1000";
    const { POST } = await import("src/app/sentry-tunnel/route");

    const response = await POST(
      new Request("http://localhost/sentry-tunnel", {
        method: "POST",
        headers: { "content-length": "1001" },
      }),
    );

    expect(response.status).toBe(413);
    expect(mockTunnelPost).not.toHaveBeenCalled();
  });

  it("forwards acceptable envelopes to the Sentry tunnel handler", async () => {
    const { POST } = await import("src/app/sentry-tunnel/route");
    const request = new Request("http://localhost/sentry-tunnel", {
      method: "POST",
      headers: { "content-length": "120" },
    });

    const response = await POST(request);

    expect(response.status).toBe(204);
    expect(mockTunnelPost).toHaveBeenCalledWith(request);
  });
});
