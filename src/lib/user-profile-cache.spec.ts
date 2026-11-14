import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  clearCachedUserAvatarUrl,
  getCachedUserAvatarUrl,
  getInFlightAvatarRequest,
  setCachedUserAvatarUrl,
  setInFlightAvatarRequest,
} from "src/lib/user-profile-cache";

describe("user-profile-cache", () => {
  const userId = 900_001;

  beforeEach(() => {
    jest.useFakeTimers();
    clearCachedUserAvatarUrl(userId);
  });

  afterEach(() => {
    jest.useRealTimers();
    clearCachedUserAvatarUrl(userId);
  });

  it("when no avatar was cached, returns undefined from getCachedUserAvatarUrl", () => {
    expect(getCachedUserAvatarUrl(userId)).toBeUndefined();
  });

  it("when a fresh entry exists, returns the stored avatar URL", () => {
    setCachedUserAvatarUrl(userId, "https://example.com/avatar.jpg");

    expect(getCachedUserAvatarUrl(userId)).toBe(
      "https://example.com/avatar.jpg",
    );
  });

  it("when the cache entry is older than 24 hours, evicts it and returns undefined", () => {
    setCachedUserAvatarUrl(userId, "https://example.com/stale.jpg");
    jest.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);

    expect(getCachedUserAvatarUrl(userId)).toBeUndefined();
  });

  it("when an in-flight request is registered, exposes it until the promise settles", async () => {
    let resolveRequest: (value: string | null) => void = () => {};
    const request = new Promise<string | null>((resolve) => {
      resolveRequest = resolve;
    });

    setInFlightAvatarRequest(userId, request);

    expect(getInFlightAvatarRequest(userId)).toBe(request);

    resolveRequest("https://example.com/in-flight.jpg");
    await request;

    expect(getInFlightAvatarRequest(userId)).toBeUndefined();
  });

  it("when clearCachedUserAvatarUrl runs, drops cached and in-flight state", async () => {
    setCachedUserAvatarUrl(userId, "https://example.com/cleared.jpg");
    const pending = Promise.resolve<string | null>(null);
    setInFlightAvatarRequest(userId, pending);
    await pending;

    clearCachedUserAvatarUrl(userId);

    expect(getCachedUserAvatarUrl(userId)).toBeUndefined();
    expect(getInFlightAvatarRequest(userId)).toBeUndefined();
  });
});
