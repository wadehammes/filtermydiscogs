import { describe, expect, it } from "@jest/globals";
import {
  getAuthUrlErrorMessage,
  normalizeAuthStatus,
} from "src/services/auth.service";
import { authStatusFactory } from "src/tests/factories/AuthStatus.factory";

describe("auth.service", () => {
  it("maps known OAuth URL error codes to user-facing copy", () => {
    expect(getAuthUrlErrorMessage("oauth_init_failed")).toBe(
      "Discogs sign-in could not start. Try again in a moment.",
    );
    expect(getAuthUrlErrorMessage("oauth_callback_invalid")).toBe(
      "Discogs sign-in was interrupted or invalid. Try connecting again.",
    );
    expect(getAuthUrlErrorMessage("oauth_callback_failed")).toBe(
      "Discogs sign-in did not complete. Try connecting again.",
    );
  });

  it("falls back for unknown error codes", () => {
    expect(getAuthUrlErrorMessage("unknown_code")).toBe(
      "Authentication failed. Try connecting again.",
    );
  });

  it("keeps discogsUnavailable from the auth check response", () => {
    expect(
      normalizeAuthStatus(
        authStatusFactory.authenticated({
          rateLimited: true,
          discogsUnavailable: true,
        }),
      ).discogsUnavailable,
    ).toBe(true);
  });

  it("defaults discogsUnavailable to false when the auth check omits it", () => {
    expect(
      normalizeAuthStatus({
        isAuthenticated: false,
        username: null,
        userId: null,
      }).discogsUnavailable,
    ).toBe(false);
  });
});
