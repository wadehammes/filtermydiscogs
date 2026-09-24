import { describe, expect, it } from "@jest/globals";
import { getAuthUrlErrorMessage } from "src/services/auth.service";

describe("getAuthUrlErrorMessage", () => {
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
});
