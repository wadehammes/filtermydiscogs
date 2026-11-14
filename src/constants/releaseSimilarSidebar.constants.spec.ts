import { describe, expect, it } from "@jest/globals";
import { formatSimilarReleaseCountLabel } from "src/constants/releaseSimilarSidebar.constants";

describe("formatSimilarReleaseCountLabel", () => {
  it("formats the total similar pool count", () => {
    expect(formatSimilarReleaseCountLabel(1)).toBe("1 similar");
    expect(formatSimilarReleaseCountLabel(50)).toBe("50 similar");
    expect(formatSimilarReleaseCountLabel(94)).toBe("94 similar");
  });
});
