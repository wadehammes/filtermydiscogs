import { describe, expect, it } from "@jest/globals";
import { COLLECTION_NOTE_MAX_LENGTH } from "src/constants/collection";
import {
  buildReleaseNotesFormSchema,
  isReleaseNoteTextWithinLimit,
  RELEASE_NOTE_TOO_LONG_MESSAGE,
} from "src/lib/validation/releaseNotes.schemas";

describe("releaseNotes.schemas", () => {
  it("accepts note text within the max length", () => {
    expect(isReleaseNoteTextWithinLimit("Signed copy")).toBe(true);
  });

  it("rejects note text over the max length", () => {
    expect(
      isReleaseNoteTextWithinLimit("a".repeat(COLLECTION_NOTE_MAX_LENGTH + 1)),
    ).toBe(false);
  });

  it("validates only configured text fields in the form schema", () => {
    const schema = buildReleaseNotesFormSchema([3]);

    expect(
      schema.safeParse({
        "1": "a".repeat(COLLECTION_NOTE_MAX_LENGTH + 1),
        "3": "Near Mint (NM or M-)",
      }).success,
    ).toBe(true);

    const invalid = schema.safeParse({
      "3": "a".repeat(COLLECTION_NOTE_MAX_LENGTH + 1),
    });

    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues[0]?.message).toBe(
        RELEASE_NOTE_TOO_LONG_MESSAGE,
      );
      expect(invalid.error.issues[0]?.path).toEqual(["3"]);
    }
  });
});
