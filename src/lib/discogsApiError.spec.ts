import { describe, expect, it } from "@jest/globals";
import {
  isDiscogsFetchTimeoutError,
  resolveDiscogsVerificationFailureStatus,
} from "src/lib/discogsApiError";

describe("discogsApiError helpers", () => {
  it("treats TimeoutError and AbortError as Discogs fetch timeouts", () => {
    expect(
      isDiscogsFetchTimeoutError(
        new DOMException("The operation was aborted.", "AbortError"),
      ),
    ).toBe(true);
    expect(
      isDiscogsFetchTimeoutError(
        Object.assign(new Error("The operation was aborted due to timeout"), {
          name: "TimeoutError",
        }),
      ),
    ).toBe(true);
    expect(
      isDiscogsFetchTimeoutError(new Error("Discogs API error: 502")),
    ).toBe(false);
  });

  it("maps fetch timeouts to 504 for OAuth verification handling", () => {
    expect(
      resolveDiscogsVerificationFailureStatus(
        Object.assign(new Error("The operation was aborted due to timeout"), {
          name: "TimeoutError",
        }),
      ),
    ).toBe(504);
    expect(
      resolveDiscogsVerificationFailureStatus(
        Object.assign(new Error("You must authenticate"), { status: 401 }),
      ),
    ).toBe(401);
  });
});
