import { describe, expect, it } from "@jest/globals";
import { formatDjMetadataLine } from "src/utils/formatDjMetadata";

describe("formatDjMetadataLine", () => {
  it("combines bpm and key when both are present", () => {
    expect(formatDjMetadataLine({ bpm: 128, key: "8A" })).toBe("128 · 8A");
  });

  it("returns bpm only when key is missing", () => {
    expect(formatDjMetadataLine({ bpm: 120, key: null })).toBe("120");
  });
});
