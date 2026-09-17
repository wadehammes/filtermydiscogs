import { tokensAreWithinEditDistanceOne } from "src/utils/releasePlaybackEditDistance";

describe("tokensAreWithinEditDistanceOne", () => {
  it("returns true for identical tokens", () => {
    expect(tokensAreWithinEditDistanceOne("album", "album")).toBe(true);
  });

  it("returns true for one substitution on long tokens", () => {
    expect(tokensAreWithinEditDistanceOne("album", "alnum")).toBe(true);
  });

  it("returns false when edit distance exceeds one", () => {
    expect(tokensAreWithinEditDistanceOne("album", "alien")).toBe(false);
  });

  it("returns false for short tokens", () => {
    expect(tokensAreWithinEditDistanceOne("ab", "ac")).toBe(false);
  });
});
