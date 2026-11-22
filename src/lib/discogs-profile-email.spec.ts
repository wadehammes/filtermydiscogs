import { describe, expect, it } from "@jest/globals";
import { parseDiscogsProfileEmail } from "src/lib/discogs-profile-email";

describe("parseDiscogsProfileEmail", () => {
  it("when the profile includes a valid email, returns the trimmed value", () => {
    expect(parseDiscogsProfileEmail({ email: "  dig@example.com  " })).toBe(
      "dig@example.com",
    );
  });

  it("when the profile email is missing or invalid, returns null", () => {
    expect(parseDiscogsProfileEmail({})).toBeNull();
    expect(parseDiscogsProfileEmail({ email: "not-an-email" })).toBeNull();
    expect(parseDiscogsProfileEmail({ email: 1 })).toBeNull();
  });
});
