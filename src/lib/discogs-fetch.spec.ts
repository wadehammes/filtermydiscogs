import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

describe("discogsFetch", () => {
  const originalTimeout = process.env.DISCOGS_FETCH_TIMEOUT_MS;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    process.env.DISCOGS_FETCH_TIMEOUT_MS = "40";
  });

  afterEach(() => {
    global.fetch = originalFetch;

    if (originalTimeout === undefined) {
      delete process.env.DISCOGS_FETCH_TIMEOUT_MS;
    } else {
      process.env.DISCOGS_FETCH_TIMEOUT_MS = originalTimeout;
    }
  });

  it("aborts when Discogs does not respond within the timeout", async () => {
    global.fetch = jest.fn(((_url, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      });
    }) as typeof fetch);

    const { discogsFetch } = await import("./discogs-fetch");

    await expect(
      discogsFetch("https://api.discogs.com/oauth/access_token"),
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("passes through a successful Discogs response", async () => {
    global.fetch = jest.fn(async () => {
      return new Response("oauth_token=abc&oauth_token_secret=def", {
        status: 200,
      });
    }) as typeof fetch;

    const { discogsFetch } = await import("./discogs-fetch");
    const response = await discogsFetch(
      "https://api.discogs.com/oauth/access_token",
      { method: "POST" },
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("oauth_token=abc");
  });
});
