import { describe, expect, it } from "@jest/globals";
import { shouldClearCollectionCommandPreview } from "src/utils/collectionCommandPalettePreview";

describe("shouldClearCollectionCommandPreview", () => {
  it("when query matches the source prompt, keeps preview", () => {
    expect(
      shouldClearCollectionCommandPreview({
        query: "  techno  ",
        previewSourcePrompt: "techno",
        hasPreview: true,
      }),
    ).toBe(false);
  });

  it("when query diverges from the source prompt, clears preview", () => {
    expect(
      shouldClearCollectionCommandPreview({
        query: "techno and house",
        previewSourcePrompt: "techno",
        hasPreview: true,
      }),
    ).toBe(true);
  });

  it("when there is no preview, does not clear", () => {
    expect(
      shouldClearCollectionCommandPreview({
        query: "anything",
        previewSourcePrompt: "techno",
        hasPreview: false,
      }),
    ).toBe(false);
  });
});
