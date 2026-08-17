import { describe, expect, it } from "@jest/globals";
import {
  COLLECTION_NOTE_MAX_LENGTH,
  COLLECTION_RATING_MAX,
  COLLECTION_RATING_MIN,
} from "src/constants/collection";
import {
  updateCollectionNoteBodySchema,
  updateReleaseRatingBodySchema,
} from "src/lib/validation/collection.schemas";
import { discogsUsernameSchema } from "src/lib/validation/discogs.shared.schemas";

describe("discogsUsernameSchema", () => {
  it("accepts valid usernames", () => {
    expect(discogsUsernameSchema.parse("crate-digger")).toBe("crate-digger");
  });

  it("rejects empty usernames", () => {
    const result = discogsUsernameSchema.safeParse("");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Username is required");
    }
  });

  it("rejects invalid username formats", () => {
    const result = discogsUsernameSchema.safeParse("bad username");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Invalid username format");
    }
  });
});

describe("updateCollectionNoteBodySchema", () => {
  it("accepts valid note payloads", () => {
    expect(
      updateCollectionNoteBodySchema.parse({
        username: "crate-digger",
        releaseId: 249504,
        value: "Shelf A",
      }),
    ).toEqual({
      username: "crate-digger",
      releaseId: 249504,
      folderId: 0,
      value: "Shelf A",
    });
  });

  it("rejects notes longer than the max length", () => {
    const result = updateCollectionNoteBodySchema.safeParse({
      username: "crate-digger",
      releaseId: 249504,
      value: "a".repeat(COLLECTION_NOTE_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        `Note value must be ${COLLECTION_NOTE_MAX_LENGTH} characters or less`,
      );
    }
  });
});

describe("updateReleaseRatingBodySchema", () => {
  it("accepts valid ratings", () => {
    expect(
      updateReleaseRatingBodySchema.parse({
        username: "crate-digger",
        rating: 4,
      }),
    ).toEqual({
      username: "crate-digger",
      rating: 4,
    });
  });

  it("rejects out-of-range ratings", () => {
    const result = updateReleaseRatingBodySchema.safeParse({
      username: "crate-digger",
      rating: COLLECTION_RATING_MAX + 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        `Rating must be an integer between ${COLLECTION_RATING_MIN} and ${COLLECTION_RATING_MAX}`,
      );
    }
  });
});
