import { describe, expect, it } from "@jest/globals";
import {
  TRACK_YOUTUBE_OVERRIDE_INVALID_INPUT_MESSAGE,
  trackYoutubeOverrideFormSchema,
} from "src/lib/validation/userTrack.schemas";

describe("userTrack.schemas", () => {
  it("trackYoutubeOverrideFormSchema allows empty input for remove-link flow", () => {
    expect(
      trackYoutubeOverrideFormSchema.safeParse({ youtubeInput: "" }).success,
    ).toBe(true);
    expect(
      trackYoutubeOverrideFormSchema.safeParse({ youtubeInput: "   " }).success,
    ).toBe(true);
  });

  it("trackYoutubeOverrideFormSchema accepts bare ids and watch URLs", () => {
    expect(
      trackYoutubeOverrideFormSchema.safeParse({
        youtubeInput: "dQw4w9WgXcQ",
      }).success,
    ).toBe(true);
    expect(
      trackYoutubeOverrideFormSchema.safeParse({
        youtubeInput: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      }).success,
    ).toBe(true);
  });

  it("trackYoutubeOverrideFormSchema rejects invalid YouTube input", () => {
    const invalid = trackYoutubeOverrideFormSchema.safeParse({
      youtubeInput: "not-a-link",
    });

    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues[0]?.message).toBe(
        TRACK_YOUTUBE_OVERRIDE_INVALID_INPUT_MESSAGE,
      );
      expect(invalid.error.issues[0]?.path).toEqual(["youtubeInput"]);
    }
  });
});
