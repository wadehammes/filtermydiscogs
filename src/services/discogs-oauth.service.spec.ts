import { beforeEach, describe, expect, it } from "@jest/globals";

jest.mock("src/lib/discogs-fetch", () => ({
  discogsFetch: jest.fn(),
}));

import { discogsFetch } from "src/lib/discogs-fetch";
import { discogsOAuthService } from "src/services/discogs-oauth.service";
import { discogsIdentityFactory } from "src/tests/factories/DiscogsIdentity.factory";

const mockDiscogsFetch = jest.mocked(discogsFetch);

const DISCOGS_OUTAGE_HTML =
  '<!DOCTYPE html>\n<html lang="en-US"><head><title>This Page is Unavailable Right Now | Discogs</title></head><body></body></html>';

describe("discogsOAuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("does not use an HTML error page as the error message when Discogs is down", async () => {
    mockDiscogsFetch.mockResolvedValue(
      new Response(DISCOGS_OUTAGE_HTML, {
        status: 502,
        headers: { "Content-Type": "text/html" },
      }),
    );

    await expect(
      discogsOAuthService.getIdentity("token", "secret"),
    ).rejects.toMatchObject({
      message: "Discogs API error: 502",
      status: 502,
    });
  });

  it("uses the Discogs JSON message when the error body is JSON", async () => {
    mockDiscogsFetch.mockResolvedValue(
      new Response(JSON.stringify({ message: "You must authenticate." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      discogsOAuthService.getIdentity("token", "secret"),
    ).rejects.toMatchObject({
      message: "You must authenticate.",
      status: 401,
    });
  });

  it("uses a short plain-text error body as the message", async () => {
    mockDiscogsFetch.mockResolvedValue(
      new Response("Service Unavailable", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    await expect(
      discogsOAuthService.getIdentity("token", "secret"),
    ).rejects.toMatchObject({
      message: "Service Unavailable",
      status: 503,
    });
  });

  it("returns the parsed identity on success", async () => {
    const identity = discogsIdentityFactory.forUser({
      id: 42,
      username: "crate-digger",
    });
    mockDiscogsFetch.mockResolvedValue(
      new Response(JSON.stringify(identity), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      discogsOAuthService.getIdentity("token", "secret"),
    ).resolves.toEqual(identity);
  });
});
