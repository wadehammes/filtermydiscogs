import { describe, expect, it } from "@jest/globals";
import {
  promptMentionsCollectionCrate,
  shouldClearCollectionCommandPreview,
} from "src/utils/collectionCommandPalettePreview";

describe("promptMentionsCollectionCrate", () => {
  it("when the prompt names a crate, returns true", () => {
    expect(promptMentionsCollectionCrate("Build a crate of 90s techno")).toBe(
      true,
    );
    expect(promptMentionsCollectionCrate("CRATES from 2018")).toBe(true);
  });

  it("when the prompt does not mention crates, returns false", () => {
    expect(promptMentionsCollectionCrate("Techno from 2018")).toBe(false);
    expect(promptMentionsCollectionCrate("  ")).toBe(false);
  });
});

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
