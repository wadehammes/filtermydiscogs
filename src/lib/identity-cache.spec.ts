import { afterEach, describe, expect, it } from "@jest/globals";
import {
  type CachedDiscogsIdentity,
  clearCachedIdentity,
  getCachedIdentity,
  getIdentityCacheKey,
  getInFlightIdentityRequest,
  setCachedIdentity,
  setInFlightIdentityRequest,
} from "./identity-cache";

describe("identity-cache", () => {
  const token = "access-token";
  const secret = "access-secret";
  const cacheKey = getIdentityCacheKey({
    accessToken: token,
    accessTokenSecret: secret,
  });

  it("derives a stable cache key from the OAuth token pair", () => {
    expect(
      getIdentityCacheKey({ accessToken: token, accessTokenSecret: secret }),
    ).toBe(cacheKey);
    expect(
      getIdentityCacheKey({
        accessToken: "other-token",
        accessTokenSecret: secret,
      }),
    ).not.toBe(cacheKey);
  });

  afterEach(() => {
    clearCachedIdentity(cacheKey);
  });

  it("returns fresh cached identity within TTL", () => {
    setCachedIdentity({
      cacheKey,
      identity: { userId: 42, username: "crate-digger" },
    });

    expect(getCachedIdentity({ cacheKey })).toEqual({
      userId: 42,
      username: "crate-digger",
      verifiedAt: expect.any(Number),
    });
  });

  it("returns stale cached identity when allowed", () => {
    const entry = setCachedIdentity({
      cacheKey,
      identity: { userId: 42, username: "crate-digger" },
    });
    entry.verifiedAt = Date.now() - 400_000;

    expect(getCachedIdentity({ cacheKey })).toBeNull();
    expect(getCachedIdentity({ cacheKey, allowStale: true })?.username).toBe(
      "crate-digger",
    );
  });

  it("deduplicates in-flight identity requests by cache key", async () => {
    let resolveRequest: ((value: CachedDiscogsIdentity) => void) | undefined;
    const request = new Promise<CachedDiscogsIdentity>((resolve) => {
      resolveRequest = resolve;
    });

    setInFlightIdentityRequest({ cacheKey, request });

    expect(getInFlightIdentityRequest(cacheKey)).toBe(request);

    resolveRequest?.({
      userId: 7,
      username: "dj",
      verifiedAt: Date.now(),
    });
    await request;

    expect(getInFlightIdentityRequest(cacheKey)).toBeUndefined();
  });
});
