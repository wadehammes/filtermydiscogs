import { describe, expect, it } from "@jest/globals";
import {
  formatSimilarReleaseCountLabel,
  getSimilarReleasePageDigitCh,
} from "src/constants/releaseSimilarSidebar.constants";

describe("formatSimilarReleaseCountLabel", () => {
  it("formats the total similar pool count", () => {
    expect(formatSimilarReleaseCountLabel(1)).toBe("1 similar");
    expect(formatSimilarReleaseCountLabel(50)).toBe("50 similar");
    expect(formatSimilarReleaseCountLabel(94)).toBe("94 similar");
  });
});

describe("getSimilarReleasePageDigitCh", () => {
  it("sizes fixed page number columns from the total page count", () => {
    expect(getSimilarReleasePageDigitCh(9)).toBe(1);
    expect(getSimilarReleasePageDigitCh(18)).toBe(2);
    expect(getSimilarReleasePageDigitCh(100)).toBe(3);
  });
});
