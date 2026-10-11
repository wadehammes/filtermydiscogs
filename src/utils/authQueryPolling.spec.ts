import { describe, expect, it } from "@jest/globals";
import { authStatusFactory } from "src/tests/factories/AuthStatus.factory";
import {
  authCheckRefetchIntervalMs,
  authCheckRefetchOnWindowFocus,
} from "src/utils/authQueryPolling";

describe("authQueryPolling", () => {
  it("does not poll when auth check is healthy", () => {
    expect(authCheckRefetchIntervalMs(authStatusFactory.authenticated())).toBe(
      false,
    );
    expect(
      authCheckRefetchOnWindowFocus(authStatusFactory.authenticated()),
    ).toBe(false);
  });

  it("polls every minute when Discogs is rate limited but not in outage mode", () => {
    const status = authStatusFactory.authenticated({
      rateLimited: true,
      discogsUnavailable: false,
    });

    expect(authCheckRefetchIntervalMs(status)).toBe(60_000);
    expect(authCheckRefetchOnWindowFocus(status)).toBe(true);
  });

  it("polls less often during a confirmed Discogs outage and skips window-focus refetch", () => {
    const status = authStatusFactory.discogsOutage();

    expect(authCheckRefetchIntervalMs(status)).toBe(120_000);
    expect(authCheckRefetchOnWindowFocus(status)).toBe(false);
  });
});
