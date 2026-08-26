import { describe, expect, it } from "@jest/globals";
import { matchSelectedTagsWithOperator } from "./matchFilterOperator";

describe("matchSelectedTagsWithOperator", () => {
  const releaseTags = new Set(["Rock", "Electronic"]);

  const releaseHasTag = (tag: string) => releaseTags.has(tag);

  it("returns true when no tags are selected", () => {
    expect(matchSelectedTagsWithOperator([], "OR", releaseHasTag)).toBe(true);
  });

  it("matches ANY when at least one selected tag is present", () => {
    expect(
      matchSelectedTagsWithOperator(["Rock", "Jazz"], "OR", releaseHasTag),
    ).toBe(true);
    expect(
      matchSelectedTagsWithOperator(["Jazz", "Pop"], "OR", releaseHasTag),
    ).toBe(false);
  });

  it("matches ALL when every selected tag is present", () => {
    releaseTags.add("Ambient");

    expect(
      matchSelectedTagsWithOperator(
        ["Rock", "Electronic"],
        "AND",
        releaseHasTag,
      ),
    ).toBe(true);
    expect(
      matchSelectedTagsWithOperator(["Rock", "Jazz"], "AND", releaseHasTag),
    ).toBe(false);
  });

  it("matches NONE when no selected tag is present", () => {
    expect(
      matchSelectedTagsWithOperator(["Jazz", "Pop"], "NONE", releaseHasTag),
    ).toBe(true);
    expect(
      matchSelectedTagsWithOperator(["Rock", "Jazz"], "NONE", releaseHasTag),
    ).toBe(false);
  });
});
