import { describe, expect, it } from "@jest/globals";
import {
  normalizePlaylistPublicDescriptionForStorage,
  resolvePlaylistPublicShareMetaDescription,
} from "src/utils/publicPlaylistDescription";

describe("normalizePlaylistPublicDescriptionForStorage", () => {
  it("trims whitespace and returns null for empty strings", () => {
    expect(normalizePlaylistPublicDescriptionForStorage("  hello  ")).toBe(
      "hello",
    );
    expect(normalizePlaylistPublicDescriptionForStorage("   ")).toBeNull();
    expect(normalizePlaylistPublicDescriptionForStorage("")).toBeNull();
  });
});

describe("resolvePlaylistPublicShareMetaDescription", () => {
  it("uses the owner blurb when present", () => {
    expect(
      resolvePlaylistPublicShareMetaDescription(
        "Deep cuts from my 90s crate.",
        () => "fallback",
      ),
    ).toBe("Deep cuts from my 90s crate.");
  });

  it("falls back when the blurb is blank", () => {
    expect(
      resolvePlaylistPublicShareMetaDescription("   ", () => "fallback copy"),
    ).toBe("fallback copy");
  });

  it("truncates long blurbs for meta tags", () => {
    const long = `${"a".repeat(200)} end`;

    expect(
      resolvePlaylistPublicShareMetaDescription(long, () => "fallback"),
    ).toHaveLength(160);
    expect(
      resolvePlaylistPublicShareMetaDescription(long, () => "fallback"),
    ).toMatch(/…$/);
  });
});
